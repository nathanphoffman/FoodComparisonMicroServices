//! Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
//! All functions are free of I/O and WASM-bindgen concerns.

mod eco;
mod emissions;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};

const GRAMS_PER_KG: f64 = 1_000.0;
const CALORIE_NORM_FALLBACK: f64 = 1_000.0;
const PROTEIN_NORM_FALLBACK: f64 = 100.0;
const FIBER_SCORE_WEIGHT: f64 = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;
const NUTRITION_SCORE_SCALE: f64 = 100.0;

// ── Batch-derived normalisation ───────────────────────────────────────────────

/// Arithmetic mean of the positive, finite values in `iter`, or `None` if
/// there are no such values.
fn mean_nonzero(iter: impl Iterator<Item = f64>) -> Option<f64> {
    let (sum, count) = iter
        .filter(|&v| v > 0.0 && v.is_finite())
        .fold((0.0_f64, 0_usize), |(s, n), v| (s + v, n + 1));
    if count == 0 { None } else { Some(sum / count as f64) }
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

/// Scores a batch of foods against the given slider query.
///
/// Two-pass algorithm: the first pass computes per-food raw scores and
/// divisors; the second pass normalises each column into log-space min–max
/// ranges to produce the final 0–100 composite score.
pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    let norms = NormFactors::from_foods(&foods);
    let mut rows: Vec<ScoredRow> = foods.iter().map(|food| compute_row(food, query, &norms)).collect();
    let column_ranges = scoring::compute_column_ranges(&rows);
    for row in &mut rows {
        row.final_score = scoring::compute_final_score(row, &column_ranges);
    }
    rows
}

// ── Per-food computation ─────────────────────────────────────────────────────

fn compute_row(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> ScoredRow {
    let divisor = compute_divisor(food, query, norms);

    let nutrition_score = if food.calories > 0.0 {
        let raw =
            food.protein + FIBER_SCORE_WEIGHT * food.fiber - SAT_FAT_SCORE_PENALTY * food.sat_fat;
        Some(raw / food.calories * NUTRITION_SCORE_SCALE / divisor)
    } else {
        None
    };

    let (emissions_raw, emissions_breakdown) = emissions::compute_emissions(food);
    let (land_use_raw, land_use_detail) = eco::compute_land_use(food);
    let (water_raw, water_detail) = water::effective_water(food, query);
    let (eco_raw, eco_detail) = eco::compute_eco_destruction(food);

    let direct_kill_raw = eco::compute_direct_kill(food);

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
        // kill_multiplier is applied to eco_destruction as a divisor, matching TS
        eco_destruction: Some(eco_raw / divisor / query.kill_multiplier),
        final_score: None, // filled in by apply()

        emissions_breakdown,
        water_detail,
        land_use_detail,
        eco_destruction_detail: eco_detail,
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

fn compute_divisor(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> f64 {
    // calories and protein are given to us in per gram
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg = food.protein * GRAMS_PER_KG;

    // Divide by batch-derived means so the average food contributes ~1.0 on
    // each dimension — the same unit as the mass term — making the slider
    // weights directly comparable regardless of dataset scale.
    let weighted = (query.mass_weight / 100.0) * 1.0
        + (query.calorie_weight / 100.0) * (calories_per_kg / norms.calorie_norm)
        + (query.protein_weight / 100.0) * (protein_per_kg / norms.protein_norm);
    if weighted > 0.0 {
        weighted
    } else {
        1.0
    }
}
