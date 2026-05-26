/// Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
/// All functions are free of I/O and WASM-bindgen concerns.
mod emissions;
mod eco;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};

const GRAMS_PER_KG: f64          = 1_000.0;
const CALORIE_NORM: f64          = 1_000.0;
const PROTEIN_NORM: f64          = 100.0;
const FIBER_SCORE_WEIGHT: f64    = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;
const NUTRITION_SCORE_SCALE: f64 = 100.0;

// ── Entry point ──────────────────────────────────────────────────────────────

pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    let mut rows: Vec<ScoredRow> = foods.iter().map(|food| compute_row(food, query)).collect();
    let averages = scoring::compute_averages(&rows);
    for row in &mut rows {
        row.final_score = scoring::compute_final_score(row, &averages);
    }
    rows
}

// ── Per-food computation ─────────────────────────────────────────────────────

fn compute_row(food: &FoodRow, query: &SliderQuery) -> ScoredRow {
    let divisor = compute_divisor(food, query);

    let nutrition_score = if food.calories > 0.0 {
        let raw = food.protein
            + FIBER_SCORE_WEIGHT * food.fiber
            - SAT_FAT_SCORE_PENALTY * food.sat_fat;
        Some(raw / food.calories * NUTRITION_SCORE_SCALE / divisor)
    } else {
        None
    };

    let (emissions_raw, emissions_breakdown) = emissions::compute_emissions(food);
    let (land_use_raw,  land_use_detail)     = eco::compute_land_use(food);
    let (water_raw,     water_detail)        = water::effective_water(food, query);
    let (eco_raw,       eco_detail)          = eco::compute_eco_destruction(food);

    let direct_kill_raw = eco::compute_direct_kill(food);

    ScoredRow {
        name:      food.name.clone(),
        slug:      food.slug.clone(),
        food_type: food.food_type.clone(),
        divisor,

        nutrition_score,
        emissions:       Some(emissions_raw       / divisor),
        land_use:        Some(land_use_raw        / divisor),
        water:           Some(water_raw           / divisor),
        direct_kill:     Some(direct_kill_raw     / divisor),
        // kill_multiplier is applied to eco_destruction as a divisor, matching TS
        eco_destruction: Some(eco_raw / divisor / query.kill_multiplier),
        final_score:     None, // filled in by apply()

        emissions_breakdown,
        water_detail,
        land_use_detail,
        eco_destruction_detail: eco_detail,
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

fn compute_divisor(food: &FoodRow, query: &SliderQuery) -> f64 {
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg  = food.protein  * GRAMS_PER_KG;
    let weighted = (query.mass_weight    / 100.0) * 1.0
                 + (query.calorie_weight / 100.0) * (calories_per_kg / CALORIE_NORM)
                 + (query.protein_weight / 100.0) * (protein_per_kg  / PROTEIN_NORM);
    if weighted > 0.0 { weighted } else { 1.0 }
}
