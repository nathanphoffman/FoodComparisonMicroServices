//! Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
//! All functions are free of I/O and WASM-bindgen concerns.

mod divisor;
mod eco;
mod emissions;
mod meal;
mod nutrition;
mod row;
mod scoring;
mod water;

use crate::models::{FoodRow, ScoredRow, SliderQuery};
use divisor::NormFactors;
use row::compute_row;

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

    let penalty_for = |slug: &str| {
        foods.iter().find(|f| f.slug == slug).map_or(1.0, |f| wild_penalty(f, query))
    };

    if let Some((ref reference, ref caps)) = scoring_context {
        let reference_penalty = penalty_for(&reference.slug);
        for row in &mut rows {
            row.final_score = if reference.divisor <= 0.0 {
                None // the reference itself has none of the Compare By unit
            } else if row.divisor <= 0.0 {
                Some(0.0) // provides none of what we're comparing by — worst possible
            } else {
                // Relative to the reference's own penalty, so a wild reference still scores 1.
                let penalty = penalty_for(&row.slug) / reference_penalty;
                scoring::compute_improvement(row, reference, caps, query).map(|score| score / penalty)
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
                // Each ingredient's wild penalty counts in proportion to its share of the meal.
                let total_fraction: f64 = query.meal_ingredients.iter().map(|i| i.fraction).sum();
                let meal_penalty: f64 = query.meal_ingredients.iter()
                    .map(|i| i.fraction / total_fraction * penalty_for(&i.slug))
                    .sum();
                let penalty = meal_penalty / penalty_for(&reference.slug);
                scoring::compute_improvement(&meal, reference, caps, query).map(|score| score / penalty)
            };
        }
        rows.push(meal);
    }

    rows
}

/// Final-score divisor for a food tagged "wild": the Over-Hunting factor for
/// animals, Over-Gathering for plants. 1.0 (no penalty) for everything else.
fn wild_penalty(food: &FoodRow, query: &SliderQuery) -> f64 {
    if !food.tags.iter().any(|tag| tag == "wild") {
        return 1.0;
    }
    let factor = if food.food_type == "animal" { query.over_hunting_factor } else { query.over_gathering_factor };
    factor.max(1.0)
}
