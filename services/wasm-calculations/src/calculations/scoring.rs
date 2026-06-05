use crate::models::ScoredRow;

pub struct DimensionCaps {
    pub emissions:     f64,
    pub land_use:      f64,
    pub water:         f64,
    pub direct_kill:   f64,
    pub sentient_harm: f64,
}

impl DimensionCaps {
    pub fn from_rows(rows: &[ScoredRow], reference: &ScoredRow) -> Self {
        Self {
            emissions:     highest_ratio_in_batch(rows, reference.emissions,     |r| r.emissions),
            land_use:      highest_ratio_in_batch(rows, reference.land_use,      |r| r.land_use),
            water:         highest_ratio_in_batch(rows, reference.water,         |r| r.water),
            direct_kill:   highest_ratio_in_batch(rows, reference.direct_kill,   |r| r.direct_kill),
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
    zero_score_multiplier: f64,
) -> Option<f64> {
    let mut dimension_ratios: Vec<f64> = Vec::new();

    // Lower-is-better: ratio = reference / food.
    // Zero food score means the food is perfect for this dimension — use the batch
    // cap so it still registers as meaningfully better than the reference.
    for (food_score, reference_score, zero_cap) in [
        (food.emissions,     reference.emissions,     caps.emissions),
        (food.land_use,      reference.land_use,      caps.land_use),
        (food.water,         reference.water,         caps.water),
        (food.direct_kill,   reference.direct_kill,   caps.direct_kill),
        (food.sentient_harm, reference.sentient_harm, caps.sentient_harm),
    ] {
        if let (Some(food_score), Some(reference_score)) = (food_score, reference_score) {
            if reference_score > 0.0 {
                let ratio = if food_score <= 0.0 { zero_cap * zero_score_multiplier } else { reference_score / food_score };
                dimension_ratios.push(ratio);
            }
        }
    }

    // Higher-is-better: ratio = food / reference.
    for (food_score, reference_score) in [
        (food.nutrition_score, reference.nutrition_score),
        (food.availability,    reference.availability),
    ] {
        if let (Some(food_score), Some(reference_score)) = (food_score, reference_score) {
            if food_score > 0.0 && reference_score > 0.0 {
                dimension_ratios.push(food_score / reference_score);
            }
        }
    }

    if dimension_ratios.is_empty() { return None; }

    let log_sum: f64 = dimension_ratios.iter().map(|ratio| ratio.ln()).sum();
    let geometric_mean = (log_sum / dimension_ratios.len() as f64).exp();
    Some(geometric_mean)
}
