use crate::models::{ScoredRow, SliderQuery};

pub struct DimensionCaps {
    pub emissions:     f64,
    pub land_use:      f64,
    pub water:         f64,
    pub sentient_harm: f64,
}

impl DimensionCaps {
    pub fn from_rows(rows: &[ScoredRow], reference: &ScoredRow) -> Self {
        Self {
            emissions:     highest_ratio_in_batch(rows, reference.emissions,     |r| r.emissions),
            land_use:      highest_ratio_in_batch(rows, reference.land_use,      |r| r.land_use),
            water:         highest_ratio_in_batch(rows, reference.water,         |r| r.water),
            sentient_harm: highest_ratio_in_batch(rows, reference.sentient_harm, |r| r.sentient_harm),
        }
    }
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
        Some(v) if v > 0.0 => v,
        _ => return 1.0,
    };
    rows.iter()
        .filter_map(|r| extract(r))
        .filter(|&food_score| food_score > 0.0)
        .map(|food_score| reference_value / food_score)
        .fold(1.0_f64, f64::max)
}

pub fn compute_improvement(
    food: &ScoredRow,
    reference: &ScoredRow,
    caps: &DimensionCaps,
    query: &SliderQuery,
) -> Option<f64> {
    // (ratio, priority) pairs — ratio > 1 means the food beats the reference.
    let mut weighted_ratios: Vec<(f64, f64)> = Vec::new();

    // Lower-is-better: ratio = reference / food.
    // Zero food score means the food is perfect for this dimension — use the batch
    // cap so it still registers as meaningfully better than the reference.
    // Intelligence uses sentient_harm only; it already includes direct_kill.
    for (food_score, reference_score, zero_cap, priority) in [
        (food.emissions,     reference.emissions,     caps.emissions,     query.emissions_priority),
        (food.land_use,      reference.land_use,      caps.land_use,      query.land_use_priority),
        (food.water,         reference.water,         caps.water,         query.water_priority),
        (food.sentient_harm, reference.sentient_harm, caps.sentient_harm, query.intelligence_priority),
    ] {
        if let (Some(food_score), Some(reference_score)) = (food_score, reference_score) {
            if reference_score > 0.0 {
                let ratio = if food_score <= 0.0 { zero_cap * query.zero_better_multiplier } else { reference_score / food_score };
                weighted_ratios.push((ratio, priority));
            }
        }
    }

    // Higher-is-better: ratio = food / reference.
    for (food_score, reference_score, priority) in [
        (food.nutrition_score, reference.nutrition_score, query.nutrition_priority),
        (food.availability,    reference.availability,    query.availability_priority),
    ] {
        if let (Some(food_score), Some(reference_score)) = (food_score, reference_score) {
            if food_score > 0.0 && reference_score > 0.0 {
                weighted_ratios.push((food_score / reference_score, priority));
            }
        }
    }

    // Weighted geometric mean — a 0% priority drops that measure out entirely.
    let total_priority: f64 = weighted_ratios.iter().map(|(_, priority)| priority).sum();
    if total_priority <= 0.0 { return None; }

    let weighted_log_sum: f64 = weighted_ratios.iter().map(|(ratio, priority)| ratio.ln() * priority).sum();
    Some((weighted_log_sum / total_priority).exp())
}
