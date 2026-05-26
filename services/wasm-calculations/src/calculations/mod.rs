/// Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
/// All functions are free of I/O and WASM-bindgen concerns.
mod emissions;
mod eco;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};

const GRAMS_PER_KG: f64          = 1_000.0; // unit conversion: g per kg
const CALORIE_NORM: f64          = 1_000.0; // kcal/kg basis for divisor normalisation
const PROTEIN_NORM: f64          = 100.0;   // g/kg basis for divisor normalisation
const FIBER_SCORE_WEIGHT: f64    = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;
const NUTRITION_SCORE_SCALE: f64 = 100.0;

// ── Entry point ──────────────────────────────────────────────────────────────

pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    let mut rows: Vec<ScoredRow> = foods.iter().map(|food_row| compute_row(food_row, query)).collect();
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
        let raw_nutrition_score = food.protein
            + FIBER_SCORE_WEIGHT * food.fiber
            - SAT_FAT_SCORE_PENALTY * food.sat_fat;
        Some(raw_nutrition_score / food.calories * NUTRITION_SCORE_SCALE / divisor)
    } else {
        None
    };

    let emissions_raw        = emissions::compute_emissions(food)         / divisor;
    let land_use_raw         = eco::compute_land_use(food)                / divisor;
    let water_raw            = water::effective_water(food, query)        / divisor;
    let direct_kill_raw      = eco::compute_direct_kill(food)             / divisor;
    // kill_multiplier is a divisor on eco destruction, matching TS philosophicalKill usage:
    // ecoDestruction / d / philosophicalKill
    let eco_destruction_raw  = eco::compute_eco_destruction(food) / divisor / query.kill_multiplier;

    ScoredRow {
        name:            food.name.clone(),
        slug:            food.slug.clone(),
        food_type:       food.food_type.clone(),
        nutrition_score,
        emissions:       Some(emissions_raw),
        land_use:        Some(land_use_raw),
        water:           Some(water_raw),
        direct_kill:     Some(direct_kill_raw),
        eco_destruction: Some(eco_destruction_raw),
        final_score:     None, // filled in by apply()
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

fn compute_divisor(food: &FoodRow, query: &SliderQuery) -> f64 {
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg  = food.protein  * GRAMS_PER_KG;
    let weighted_divisor = (query.mass_weight    / 100.0) * 1.0
                         + (query.calorie_weight / 100.0) * (calories_per_kg / CALORIE_NORM)
                         + (query.protein_weight / 100.0) * (protein_per_kg  / PROTEIN_NORM);
    if weighted_divisor > 0.0 { weighted_divisor } else { 1.0 }
}
