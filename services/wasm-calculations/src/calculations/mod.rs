//! Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
//! All functions are free of I/O and WASM-bindgen concerns.

mod divisor;
mod eco;
mod emissions;
mod final_score;
mod meal;
mod nutrition;
mod row;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};
use divisor::NormFactors;
use final_score::Comparison;
use row::compute_row;

// ── Entry point ──────────────────────────────────────────────────────────────

/// Scores every food, plus the custom meal (if any) as the last row.
pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    // 1. Per-food values (emissions, land use, water, harm, …) in Compare By units.
    let norms = NormFactors::from_foods(&foods);
    let mut rows: Vec<ScoredRow> = foods
        .iter()
        .map(|food| compute_row(food, query, &norms))
        .collect();

    // 2. The custom meal, blended from its ingredients' rows.
    let mut meal = meal::synthesize_meal(&rows, &query.meal_ingredients);

    // 3. Final scores, relative to the reference food. Left as None when the
    //    reference isn't in the batch.
    if let Some(comparison) = Comparison::new(&rows, &foods, query) {
        for row in &mut rows {
            row.final_score = comparison.food_score(row);
        }
        if let Some(meal) = &mut meal {
            meal.final_score = comparison.meal_score(meal, &rows);
        }
    }

    rows.extend(meal);
    rows
}
