use super::power_mean::weighted_power_mean;
use crate::models::{ImprovementDetail, ImprovementTerm, ScoredRow, SliderQuery};

/// Nutrition score the worst food in the batch is shifted up to, so every
/// nutrition score is positive and can be compared as a ratio.
const NUTRITION_FLOOR: f64 = 1.0;

pub struct DimensionCaps {
    pub emissions:     f64,
    pub land_use:      f64,
    pub water:         f64,
    pub sentient_harm: f64,
    /// Added to every nutrition score before taking the food / reference ratio.
    /// Nutrition scores can be negative (saturated fat or free sugar outweighs protein + fiber),
    /// and a plain ratio can't handle that — negative foods used to be skipped,
    /// which hid their bad nutrition. 0 when every score is already ≥ the floor.
    pub nutrition_offset: f64,
}

impl DimensionCaps {
    pub fn from_rows(rows: &[ScoredRow], reference: &ScoredRow) -> Self {
        Self {
            emissions:     highest_ratio_in_batch(rows, reference.emissions,     |row| row.emissions),
            land_use:      highest_ratio_in_batch(rows, reference.land_use,      |row| row.land_use),
            water:         highest_ratio_in_batch(rows, reference.water,         |row| row.water),
            sentient_harm: highest_ratio_in_batch(rows, reference.sentient_harm, |row| row.sentient_harm),
            nutrition_offset: nutrition_offset(rows),
        }
    }
}

// Shift that lifts the lowest nutrition score in the batch to NUTRITION_FLOOR.
fn nutrition_offset(rows: &[ScoredRow]) -> f64 {
    let lowest = rows.iter()
        .filter_map(|row| row.nutrition_score)
        .filter(|score| score.is_finite())
        // Keep the smallest finite score: start at infinity and let f64::min pull it down.
        .fold(f64::INFINITY, f64::min);
    if lowest.is_finite() { (NUTRITION_FLOOR - lowest).max(0.0) } else { 0.0 }
}

// Returns the highest reference/food ratio across all rows for one dimension.
// Used as the cap when a food scores zero — it was at least as good as the
// best non-zero food in the batch. Falls back to 1.0 if the reference has no data.
fn highest_ratio_in_batch(
    rows: &[ScoredRow],
    reference_score: Option<f64>,
    extract: impl Fn(&ScoredRow) -> Option<f64>,
) -> f64 {
    let reference_value = match reference_score {
        Some(ratio) if ratio > 0.0 => ratio,
        _ => return 1.0,
    };
    rows.iter()
        .filter_map(|row| extract(row))
        .filter(|&food_score| food_score > 0.0)
        .map(|food_score| reference_value / food_score)
        // Keep the largest ratio: start at 1.0 and let f64::max pull it up.
        .fold(1.0_f64, f64::max)
}

pub fn compute_improvement(
    food: &ScoredRow,
    reference: &ScoredRow,
    caps: &DimensionCaps,
    query: &SliderQuery,
) -> Option<ImprovementDetail> {
    let mut terms = lower_is_better_terms(food, reference, caps, query);
    terms.extend(higher_is_better_terms(food, reference, caps, query));

    // A 0% priority drops that measure out entirely.
    let total_priority: f64 = terms.iter().map(|term| term.priority).sum();
    if total_priority <= 0.0 { return None; }

    let exponent = 1.0 - query.win_dampening;
    // Pair each term's ratio with its priority, the shape weighted_power_mean takes.
    let weighted_ratios: Vec<(f64, f64)> = terms.iter().map(|term| (term.ratio, term.priority)).collect();
    let mean = weighted_power_mean(&weighted_ratios, total_priority, exponent);
    Some(ImprovementDetail { terms, exponent, mean, wild_penalty: 1.0 })
}

// Lower-is-better: ratio = reference / food (> 1 means the food beats the reference).
// Zero food score means the food is perfect for this dimension — use the batch
// cap so it still registers as meaningfully better than the reference.
// Intelligence uses sentient_harm only; it already includes direct_kill.
fn lower_is_better_terms(food: &ScoredRow, reference: &ScoredRow, caps: &DimensionCaps, query: &SliderQuery) -> Vec<ImprovementTerm> {
    let mut terms = Vec::new();
    for (measure, food_score, reference_score, zero_cap, priority) in [
        ("emissions",    food.emissions,     reference.emissions,     caps.emissions,     query.emissions_priority),
        ("landUse",      food.land_use,      reference.land_use,      caps.land_use,      query.land_use_priority),
        ("water",        food.water,         reference.water,         caps.water,         query.water_priority),
        ("sentientHarm", food.sentient_harm, reference.sentient_harm, caps.sentient_harm, query.sentient_harm_priority),
    ] {
        if let (Some(food_score), Some(reference_score)) = (food_score, reference_score) {
            if reference_score > 0.0 {
                let zero_capped = food_score <= 0.0;
                let ratio = if zero_capped { zero_cap * query.zero_better_multiplier } else { reference_score / food_score };
                terms.push(ImprovementTerm { measure, ratio, priority, zero_capped });
            }
        }
    }
    terms
}

// Higher-is-better: ratio = food / reference.
// Nutrition is shifted by the batch offset so negative scores count as bad
// rather than being dropped. The floor guards the diet row and rounding.
fn higher_is_better_terms(food: &ScoredRow, reference: &ScoredRow, caps: &DimensionCaps, query: &SliderQuery) -> Vec<ImprovementTerm> {
    let mut terms = Vec::new();
    if let (Some(food_score), Some(reference_score)) = (food.nutrition_score, reference.nutrition_score) {
        let shifted_food      = (food_score      + caps.nutrition_offset).max(NUTRITION_FLOOR);
        let shifted_reference = (reference_score + caps.nutrition_offset).max(NUTRITION_FLOOR);
        terms.push(ImprovementTerm {
            measure: "nutrition", ratio: shifted_food / shifted_reference,
            priority: query.nutrition_priority, zero_capped: false,
        });
    }
    if let (Some(food_score), Some(reference_score)) = (food.availability, reference.availability) {
        if food_score > 0.0 && reference_score > 0.0 {
            terms.push(ImprovementTerm {
                measure: "availability", ratio: food_score / reference_score,
                priority: query.availability_priority, zero_capped: false,
            });
        }
    }
    terms
}
