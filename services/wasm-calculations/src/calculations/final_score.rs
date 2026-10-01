use std::collections::HashMap;

use super::scoring::{compute_improvement, DimensionCaps};
use crate::models::{FoodRow, ImprovementDetail, ScoredRow, SliderQuery};

/// Everything needed to turn a row into its final Improvement score: the reference
/// food it's compared against, the batch caps, and each food's wild penalty.
/// Only exists when the reference food is in the batch.
pub(super) struct Comparison<'a> {
    reference:      ScoredRow,
    caps:           DimensionCaps,
    wild_penalties: HashMap<&'a str, f64>,
    query:          &'a SliderQuery,
}

impl<'a> Comparison<'a> {
    pub(super) fn new(rows: &[ScoredRow], foods: &'a [FoodRow], query: &'a SliderQuery) -> Option<Self> {
        let reference_slug = query.reference_slug.as_deref()?;
        let reference = rows.iter().find(|r| r.slug == reference_slug)?.clone();
        let caps = DimensionCaps::from_rows(rows, &reference);

        let mut wild_penalties = HashMap::new();
        for food in foods {
            // First food with a slug wins, matching a front-to-back search.
            wild_penalties.entry(food.slug.as_str()).or_insert_with(|| wild_penalty(food, query));
        }

        Some(Self { reference, caps, wild_penalties, query })
    }

    /// Final score for one food row, and how it was built (None when the score is 0
    /// because the food has none of the Compare By unit).
    pub(super) fn food_score(&self, row: &ScoredRow) -> Option<(f64, Option<ImprovementDetail>)> {
        if self.reference.divisor <= 0.0 {
            return None; // the reference itself has none of the Compare By unit
        }
        if row.divisor <= 0.0 {
            return Some((0.0, None)); // provides none of what we're comparing by — worst possible
        }
        // Relative to the reference's own penalty, so a wild reference still scores 1.
        let penalty = self.penalty_for(&row.slug) / self.penalty_for(&self.reference.slug);
        self.penalized_improvement(row, penalty).map(|detail| (detail.mean / detail.wild_penalty, Some(detail)))
    }

    /// Final score for the custom meal row. `rows` are the scored food rows.
    pub(super) fn meal_score(&self, meal: &ScoredRow, rows: &[ScoredRow]) -> Option<f64> {
        let ingredients = &self.query.meal_ingredients;

        // An ingredient with none of the Compare By unit has no per-unit impacts, so
        // the meal can't be compared fairly either.
        let has_unitless_ingredient = ingredients.iter().any(|ingredient| {
            ingredient.fraction > 0.0
                && rows.iter().any(|r| r.slug == ingredient.slug && r.divisor <= 0.0)
        });
        if has_unitless_ingredient || self.reference.divisor <= 0.0 {
            return None;
        }

        // Each ingredient's wild penalty counts in proportion to its share of the meal.
        let total_fraction: f64 = ingredients.iter().map(|i| i.fraction).sum();
        let meal_penalty: f64 = ingredients.iter()
            .map(|i| i.fraction / total_fraction * self.penalty_for(&i.slug))
            .sum();
        let penalty = meal_penalty / self.penalty_for(&self.reference.slug);
        self.penalized_improvement(meal, penalty).map(|detail| detail.mean / detail.wild_penalty)
    }

    fn penalty_for(&self, slug: &str) -> f64 {
        self.wild_penalties.get(slug).copied().unwrap_or(1.0)
    }

    fn penalized_improvement(&self, row: &ScoredRow, penalty: f64) -> Option<ImprovementDetail> {
        compute_improvement(row, &self.reference, &self.caps, self.query)
            .map(|detail| ImprovementDetail { wild_penalty: penalty, ..detail })
    }
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
