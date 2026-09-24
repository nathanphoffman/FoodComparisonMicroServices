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
}

impl NormFactors {
    fn from_foods(foods: &[FoodRow]) -> Self {
        Self {
            calorie_norm: mean_nonzero(foods.iter().map(|f| f.calories * GRAMS_PER_KG))
                .unwrap_or(CALORIE_NORM_FALLBACK),
            protein_norm: mean_nonzero(foods.iter().map(|f| f.protein * GRAMS_PER_KG))
                .unwrap_or(PROTEIN_NORM_FALLBACK),
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
            row.final_score =
                scoring::compute_improvement(row, reference, caps, query);
        }
    }

    if let Some(mut meal) = meal::synthesize_meal(&rows, &query.meal_ingredients) {
        if let Some((ref reference, ref caps)) = scoring_context {
            meal.final_score =
                scoring::compute_improvement(&meal, reference, caps, query);
        }
        rows.push(meal);
    }

    rows
}

// ── Per-food computation ─────────────────────────────────────────────────────

fn compute_row(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> ScoredRow {
    let divisor = compute_divisor(food, query, norms);

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

    let availability = if land_use_raw == 0.0 {
        food.availability_gg.unwrap_or(1.0)
    } else {
        food.availability_gg
            .map(|a| (a / land_use_raw).max(1.0) / divisor)
            .unwrap_or(1.0)
    };

    ScoredRow {
        name: food.name.clone(),
        slug: food.slug.clone(),
        food_type: food.food_type.clone(),
        divisor,

        nutrition_score,
        emissions: Some(emissions_raw / divisor),
        land_use: Some(land_use_raw / divisor),
        water: Some(water_raw / divisor),
        direct_kill: Some(direct_kill_raw / divisor),
        captive_sentience: Some(captive_raw / divisor),
        // kill_multiplier is applied to sentient_harm as a divisor, matching TS.
        // Captivity is intentional harm, so it sits alongside direct kill.
        // At 0× intentional harm carries no weight, so only accidental harm counts.
        sentient_harm: Some(if query.kill_multiplier > 0.0 {
            (direct_kill_raw + captive_raw) / divisor + sentient_harm_raw / divisor / query.kill_multiplier
        } else {
            sentient_harm_raw / divisor
        }),
        final_score: None, // filled in by apply()
        availability: Some(availability),

        emissions_breakdown,
        water_detail,
        land_use_detail,
        sentient_harm_detail,
        kill_detail: eco::compute_kill_detail(food, query),
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

fn compute_divisor(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> f64 {
    // calories and protein are given to us in per gram
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg = food.protein * GRAMS_PER_KG;

    // norms are also per gram, so we are effectively amount over norm times weight percentage
    let weighted = (query.mass_weight / 100.0) * 1.0
        + (query.calorie_weight / 100.0) * (calories_per_kg / norms.calorie_norm)
        + (query.protein_weight / 100.0) * (protein_per_kg / norms.protein_norm);
    if weighted > 0.0 {
        weighted
    } else {
        1.0
    }
}
