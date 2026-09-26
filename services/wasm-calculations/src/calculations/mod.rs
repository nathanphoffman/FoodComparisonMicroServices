//! Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
//! All functions are free of I/O and WASM-bindgen concerns.

mod eco;
mod emissions;
mod meal;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};

const GRAMS_PER_KG: f64 = 1_000.0;
const CALORIE_NORM_FALLBACK: f64 = 1_000.0;
const PROTEIN_NORM_FALLBACK: f64 = 100.0;
const DRY_MASS_NORM_FALLBACK: f64 = 300.0;
const FIBER_SCORE_WEIGHT: f64 = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;

// ── Batch-derived normalisation ───────────────────────────────────────────────

/// Arithmetic mean of the positive, finite values in `iter`, or `None` if
/// there are no such values.
fn mean_nonzero(iter: impl Iterator<Item = f64>) -> Option<f64> {
    let (sum, count) = iter
        .filter(|&v| v > 0.0 && v.is_finite())
        .fold((0.0_f64, 0_usize), |(s, n), v| (s + v, n + 1));
    if count == 0 {
        None
    } else {
        Some(sum / count as f64)
    }
}

/// Per-batch normalization factors for the divisor.
/// Each field is the arithmetic mean of the corresponding per-kg value across
/// the batch, falling back to a legacy constant when all values are zero or the
/// batch is empty.
struct NormFactors {
    calorie_norm: f64,
    protein_norm: f64,
    dry_mass_norm: f64,
}

/// Grams of dry matter per gram of food: everything except water, approximated as
/// protein + fat + carbohydrate (USDA carbs include fiber). Ash (~1%) is ignored.
/// The same whether a food is measured raw or cooked, since cooking only adds water.
fn dry_mass_per_gram(food: &FoodRow) -> f64 {
    food.protein + food.fat + food.carbs.unwrap_or(0.0)
}

impl NormFactors {
    fn from_foods(foods: &[FoodRow]) -> Self {
        Self {
            calorie_norm: mean_nonzero(foods.iter().map(|f| f.calories * GRAMS_PER_KG))
                .unwrap_or(CALORIE_NORM_FALLBACK),
            protein_norm: mean_nonzero(foods.iter().map(|f| f.protein * GRAMS_PER_KG))
                .unwrap_or(PROTEIN_NORM_FALLBACK),
            dry_mass_norm: mean_nonzero(foods.iter().map(|f| dry_mass_per_gram(f) * GRAMS_PER_KG))
                .unwrap_or(DRY_MASS_NORM_FALLBACK),
        }
    }
}

// ── Entry point ──────────────────────────────────────────────────────────────

pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    let norms = NormFactors::from_foods(&foods);
    let mut rows: Vec<ScoredRow> = foods
        .iter()
        .map(|food| compute_row(food, query, &norms))
        .collect();

    let scoring_context = query
        .reference_slug
        .as_deref()
        .and_then(|slug| rows.iter().find(|r| r.slug == slug).cloned())
        .map(|reference| {
            let caps = scoring::DimensionCaps::from_rows(&rows, &reference);
            (reference, caps)
        });

    if let Some((ref reference, ref caps)) = scoring_context {
        for row in &mut rows {
            row.final_score = if reference.divisor <= 0.0 {
                None // the reference itself has none of the Compare By unit
            } else if row.divisor <= 0.0 {
                Some(0.0) // provides none of what we're comparing by — worst possible
            } else {
                scoring::compute_improvement(row, reference, caps, query)
            };
        }
    }

    if let Some(mut meal) = meal::synthesize_meal(&rows, &query.meal_ingredients) {
        // An ingredient with none of the Compare By unit has no per-unit impacts, so
        // the meal can't be compared fairly either.
        let has_unitless_ingredient = query.meal_ingredients.iter().any(|ingredient| {
            ingredient.fraction > 0.0
                && rows.iter().any(|r| r.slug == ingredient.slug && r.divisor <= 0.0)
        });
        if let Some((ref reference, ref caps)) = scoring_context {
            meal.final_score = if has_unitless_ingredient || reference.divisor <= 0.0 {
                None
            } else {
                scoring::compute_improvement(&meal, reference, caps, query)
            };
        }
        rows.push(meal);
    }

    rows
}

// ── Per-food computation ─────────────────────────────────────────────────────

fn compute_row(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> ScoredRow {
    // None when the food has none of the Compare By unit (e.g. oil when comparing
    // by protein only): every per-unit value is then undefined, not per-kg.
    let divisor = compute_divisor(food, query, norms);
    let per_unit = |raw: f64| divisor.map(|d| raw / d);

    let nutrition_score = if food.calories > 0.0 {
        let raw =
            food.protein + FIBER_SCORE_WEIGHT * food.fiber - SAT_FAT_SCORE_PENALTY * food.sat_fat;

        // nutrition score should be flat, not weighted by a divisor it is absolute
        Some(raw * 100.0 / food.calories)
    } else {
        None
    };

    let (emissions_raw, emissions_breakdown) = emissions::compute_emissions(food);
    let (land_use_raw, land_use_detail) = eco::compute_land_use(food);
    let (water_raw, water_detail) = water::effective_water(food, query);
    let (sentient_harm_raw, mut sentient_harm_detail) = eco::compute_sentient_harm(food, query);

    let direct_kill_raw = eco::compute_direct_kill(food, query);
    let captive_raw = eco::compute_captive_sentience(food, query);
    // Detail scores are raw — the tooltip divides by the divisor.
    sentient_harm_detail.direct_kill_score = direct_kill_raw;
    sentient_harm_detail.captive_sentience_score = captive_raw;

    // Scalability: food produced ÷ land needed per unit of food, both in the same
    // calorie/protein units as the other columns. Production in units = Gg × divisor;
    // land per unit = land per kg ÷ divisor. (Dividing by the divisor instead used to
    // inflate watery, low-calorie foods like milk.)
    let availability = divisor.map(|divisor| food.availability_gg.map_or(1.0, |production_gg| {
        let production_units = production_gg * divisor;
        if land_use_raw == 0.0 {
            production_units
        } else {
            (production_units / (land_use_raw / divisor)).max(1.0)
        }
    }));

    ScoredRow {
        name: food.name.clone(),
        slug: food.slug.clone(),
        food_type: food.food_type.clone(),
        divisor: divisor.unwrap_or(0.0),

        nutrition_score,
        emissions: per_unit(emissions_raw),
        land_use: per_unit(land_use_raw),
        water: per_unit(water_raw),
        direct_kill: per_unit(direct_kill_raw),
        captive_sentience: per_unit(captive_raw),
        // kill_multiplier is applied to sentient_harm as a divisor, matching TS.
        // Captivity is intentional harm, so it sits alongside direct kill.
        // At 0× intentional harm carries no weight, so only accidental harm counts.
        sentient_harm: per_unit(if query.kill_multiplier > 0.0 {
            direct_kill_raw + captive_raw + sentient_harm_raw / query.kill_multiplier
        } else {
            sentient_harm_raw
        }),
        final_score: None, // filled in by apply()
        availability,

        emissions_breakdown,
        water_detail,
        land_use_detail,
        sentient_harm_detail,
        kill_detail: eco::compute_kill_detail(food, query),
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

/// Amount of Compare By units in one kg of this food. None when the food has none
/// of the chosen unit (it used to fall back to 1, scoring zero-protein oils as if
/// they had average protein). With every weight at 0, compares per kg.
fn compute_divisor(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> Option<f64> {
    if query.calorie_weight + query.protein_weight + query.dry_mass_weight <= 0.0 {
        return Some(1.0);
    }
    // calories and protein are given to us in per gram
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg = food.protein * GRAMS_PER_KG;

    // norms are also per gram, so we are effectively amount over norm times weight percentage.
    // No mass term: comparing per kg mostly measures water content (and dry vs cooked).
    let weighted = (query.calorie_weight / 100.0) * (calories_per_kg / norms.calorie_norm)
        + (query.protein_weight / 100.0) * (protein_per_kg / norms.protein_norm)
        + (query.dry_mass_weight / 100.0) * (dry_mass_per_gram(food) * GRAMS_PER_KG / norms.dry_mass_norm);
    if weighted > 0.0 { Some(weighted) } else { None }
}
