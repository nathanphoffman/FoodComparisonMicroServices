use crate::models::{ColumnRanges, ColumnRange, ScoredRow};

const SCORE_MAX: f64 = 100.0;
const SCORE_NEUTRAL: f64 = 50.0;

/// Indicates whether a lower or higher raw value represents a better outcome
/// for a scored dimension.
enum ScoreDirection {
    LowerIsBetter,
    HigherIsBetter,
}

pub(super) fn compute_column_ranges(rows: &[ScoredRow]) -> ColumnRanges {
    ColumnRanges {
        emissions:       compute_column_log_range(rows, |r| r.emissions),
        land_use:        compute_column_log_range(rows, |r| r.land_use),
        water:           compute_column_log_range(rows, |r| r.water),
        direct_kill:     compute_column_log_range(rows, |r| r.direct_kill),
        nutrition_score: compute_column_log_range(rows, |r| r.nutrition_score),
        eco_destruction: compute_column_log_range(rows, |r| r.eco_destruction),
    }
}

fn compute_column_log_range(
    rows: &[ScoredRow],
    selector: impl Fn(&ScoredRow) -> Option<f64>,
) -> Option<ColumnRange> {
    let values: Vec<f64> = rows.iter()
        .filter_map(selector)
        .filter(|&x| x > 0.0)
        .collect();
    if values.is_empty() { return None; }
    let log_min = values.iter().copied().fold(f64::INFINITY,     f64::min).ln();
    let log_max = values.iter().copied().fold(f64::NEG_INFINITY, f64::max).ln();
    Some(ColumnRange { log_min, log_max })
}

pub(super) fn compute_final_score(row: &ScoredRow, averages: &ColumnRanges) -> Option<f64> {
    let mut scores = Vec::new();

    if let (Some(value), Some(range)) = (row.nutrition_score, averages.nutrition_score) {
        scores.push(dimension_score(value, range, ScoreDirection::HigherIsBetter));
    }
    if let (Some(value), Some(range)) = (row.emissions, averages.emissions) {
        scores.push(dimension_score(value, range, ScoreDirection::LowerIsBetter));
    }
    if let (Some(value), Some(range)) = (row.land_use, averages.land_use) {
        scores.push(dimension_score(value, range, ScoreDirection::LowerIsBetter));
    }
    if let (Some(value), Some(range)) = (row.water, averages.water) {
        scores.push(dimension_score(value, range, ScoreDirection::LowerIsBetter));
    }
    if let (Some(value), Some(range)) = (row.direct_kill, averages.direct_kill) {
        scores.push(dimension_score(value, range, ScoreDirection::LowerIsBetter));
    }
    if let (Some(value), Some(range)) = (row.eco_destruction, averages.eco_destruction) {
        scores.push(dimension_score(value, range, ScoreDirection::LowerIsBetter));
    }

    if scores.is_empty() {
        return None;
    }
    let mean = scores.iter().sum::<f64>() / scores.len() as f64;
    Some(mean.clamp(0.0, SCORE_MAX))
}

fn dimension_score(value: f64, range: ColumnRange, direction: ScoreDirection) -> f64 {
    if value <= 0.0 {
        return match direction {
            ScoreDirection::LowerIsBetter  => SCORE_MAX,
            ScoreDirection::HigherIsBetter => 0.0,
        };
    }
    let log_val = value.ln();
    if !log_val.is_finite() { return SCORE_NEUTRAL; }
    let span = range.log_max - range.log_min;
    if span <= 0.0 { return SCORE_NEUTRAL; } // all foods identical on this dimension
    let score = match direction {
        ScoreDirection::LowerIsBetter  => SCORE_MAX * (range.log_max - log_val) / span,
        ScoreDirection::HigherIsBetter => SCORE_MAX * (log_val - range.log_min) / span,
    };
    score.clamp(0.0, SCORE_MAX)
}
