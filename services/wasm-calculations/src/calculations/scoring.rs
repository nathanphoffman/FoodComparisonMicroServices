use crate::models::{ScoredRow, SliderQuery};

/// Nutrition score the worst food in the batch is shifted up to, so every
/// nutrition score is positive and can be compared as a ratio.
const NUTRITION_FLOOR: f64 = 1.0;

pub struct DimensionCaps {
    pub emissions:     f64,
    pub land_use:      f64,
    pub water:         f64,
    pub sentient_harm: f64,
    /// Added to every nutrition score before taking the food / reference ratio.
    /// Nutrition scores can be negative (saturated fat outweighs protein + fiber),
    /// and a plain ratio can't handle that — negative foods used to be skipped,
    /// which hid their bad nutrition. 0 when every score is already ≥ the floor.
    pub nutrition_offset: f64,
}

impl DimensionCaps {
    pub fn from_rows(rows: &[ScoredRow], reference: &ScoredRow) -> Self {
        Self {
            emissions:     highest_ratio_in_batch(rows, reference.emissions,     |r| r.emissions),
            land_use:      highest_ratio_in_batch(rows, reference.land_use,      |r| r.land_use),
            water:         highest_ratio_in_batch(rows, reference.water,         |r| r.water),
            sentient_harm: highest_ratio_in_batch(rows, reference.sentient_harm, |r| r.sentient_harm),
            nutrition_offset: nutrition_offset(rows),
        }
    }
}

// Shift that lifts the lowest nutrition score in the batch to NUTRITION_FLOOR.
fn nutrition_offset(rows: &[ScoredRow]) -> f64 {
    let lowest = rows.iter()
        .filter_map(|r| r.nutrition_score)
        .filter(|score| score.is_finite())
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
    // Nutrition is shifted by the batch offset so negative scores count as bad
    // rather than being dropped. The floor guards the meal row and rounding.
    if let (Some(food_score), Some(reference_score)) = (food.nutrition_score, reference.nutrition_score) {
        let shifted_food      = (food_score      + caps.nutrition_offset).max(NUTRITION_FLOOR);
        let shifted_reference = (reference_score + caps.nutrition_offset).max(NUTRITION_FLOOR);
        weighted_ratios.push((shifted_food / shifted_reference, query.nutrition_priority));
    }
    if let (Some(food_score), Some(reference_score)) = (food.availability, reference.availability) {
        if food_score > 0.0 && reference_score > 0.0 {
            weighted_ratios.push((food_score / reference_score, query.availability_priority));
        }
    }

    // A 0% priority drops that measure out entirely.
    let total_priority: f64 = weighted_ratios.iter().map(|(_, priority)| priority).sum();
    if total_priority <= 0.0 { return None; }

    Some(weighted_power_mean(&weighted_ratios, total_priority, 1.0 - query.win_dampening))
}

/// Weighted power mean of the ratios with exponent `p`: p = 1 is the plain
/// (linear) average, where a 100× win in one measure dominates; p = 0 is the
/// geometric mean, where a 100× win exactly cancels a 100× loss; p = -1 is the
/// harmonic mean, where the weakest measure dominates.
fn weighted_power_mean(weighted_ratios: &[(f64, f64)], total_priority: f64, p: f64) -> f64 {
    if p.abs() < 1e-9 {
        let weighted_log_sum: f64 = weighted_ratios.iter().map(|(ratio, priority)| ratio.ln() * priority).sum();
        return (weighted_log_sum / total_priority).exp();
    }
    let weighted_sum: f64 = weighted_ratios.iter().map(|(ratio, priority)| ratio.powf(p) * priority).sum();
    (weighted_sum / total_priority).powf(1.0 / p)
}

#[cfg(test)]
mod tests {
    use super::weighted_power_mean;

    // One measure 100× better, five equal, all equal priority.
    const RATIOS: [(f64, f64); 6] = [(100.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0)];

    #[test]
    fn power_mean_dampening() {
        let linear    = weighted_power_mean(&RATIOS, 6.0, 1.0);
        let geometric = weighted_power_mean(&RATIOS, 6.0, 0.0);
        let harmonic  = weighted_power_mean(&RATIOS, 6.0, -1.0);
        assert!((linear - 17.5).abs() < 1e-9);
        assert!((geometric - 100f64.powf(1.0 / 6.0)).abs() < 1e-9);
        assert!(harmonic < geometric && harmonic > 1.0);
        // near-zero p converges to the geometric mean
        assert!((weighted_power_mean(&RATIOS, 6.0, 1e-6) - geometric).abs() < 1e-4);
    }
}
