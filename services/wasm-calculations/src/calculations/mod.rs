//! Scores every food and blends diets from them: per-food values, the
//! reference comparison and the final scores. All functions are free of I/O and WASM-bindgen concerns.

mod comparison;
mod eco;
mod per_food;

use crate::models::{FoodRow, ScoredRow, SliderQuery};
use comparison::{blend_diet, Blend, Comparison};
use per_food::{compute_row, NormFactors};

/// Scores every food, plus the diets (the one being planned, and the benchmark) as the last rows.
pub fn apply(foods: Vec<FoodRow>, query: &SliderQuery) -> Vec<ScoredRow> {
    // 1. Per-food values (emissions, land use, water, harm, …) in Compare By units.
    let norms = NormFactors::from_foods(&foods);
    let mut rows: Vec<ScoredRow> = foods
        .iter()
        .map(|food| compute_row(food, query, &norms))
        .collect();

    // 2. Diets, each blended from its ingredients' rows.
    let mut blends: Vec<Blend> = query.diets.iter()
        .filter_map(|diet| blend_diet(&rows, &foods, diet))
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
