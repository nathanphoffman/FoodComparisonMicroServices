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

/// Scores every food, plus any custom foods (meal, diet) as the last rows.
pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    // 1. Per-food values (emissions, land use, water, harm, …) in Compare By units.
    let norms = NormFactors::from_foods(&foods);
    let mut rows: Vec<ScoredRow> = foods
        .iter()
        .map(|food| compute_row(food, query, &norms))
        .collect();

    // 2. Custom foods (meal, diet), each blended from its ingredients' rows.
    let mut blends: Vec<meal::Blend> = query.custom_foods.iter()
        .filter_map(|custom| meal::synthesize(&rows, &foods, custom))
        .collect();

    // 3. Final scores, relative to the reference food. Left as None when the
    //    reference isn't in the batch.
    if let Some(comparison) = Comparison::new(&rows, &foods, query) {
        for row in &mut rows {
            if let Some((score, detail)) = comparison.food_score(row) {
                row.final_score = Some(score);
                row.improvement_detail = detail;
            }
        }
        for blend in &mut blends {
            blend.row.final_score = comparison.blend_score(blend);
        }
    }

    rows.extend(blends.into_iter().map(|blend| blend.row));
    rows
}
