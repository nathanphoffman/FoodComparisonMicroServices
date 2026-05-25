use crate::models::{Averages, ScoredRow};

pub(super) fn compute_averages(rows: &[ScoredRow]) -> Averages {
    Averages {
        emissions:       compute_column_average(rows, |scored_row| scored_row.emissions),
        land_use:        compute_column_average(rows, |scored_row| scored_row.land_use),
        water:           compute_column_average(rows, |scored_row| scored_row.water),
        direct_kill:     compute_column_average(rows, |scored_row| scored_row.direct_kill),
        nutrition_score: compute_column_average(rows, |scored_row| scored_row.nutrition_score),
        eco_destruction: compute_column_average(rows, |scored_row| scored_row.eco_destruction),
    }
}

fn compute_column_average(rows: &[ScoredRow], selector: impl Fn(&ScoredRow) -> Option<f64>) -> Option<f64> {
    let values: Vec<f64> = rows.iter().filter_map(selector).collect();
    if values.is_empty() { None } else { Some(values.iter().sum::<f64>() / values.len() as f64) }
}

pub(super) fn compute_final_score(row: &ScoredRow, averages: &Averages) -> Option<f64> {
    let mut scores = Vec::new();

    if let (Some(value), Some(average)) = (row.nutrition_score, averages.nutrition_score) {
        scores.push(dimension_score(value, average, false));
    }
    if let (Some(value), Some(average)) = (row.emissions, averages.emissions) {
        scores.push(dimension_score(value, average, true));
    }
    if let (Some(value), Some(average)) = (row.land_use, averages.land_use) {
        scores.push(dimension_score(value, average, true));
    }
    if let (Some(value), Some(average)) = (row.water, averages.water) {
        scores.push(dimension_score(value, average, true));
    }
    if let (Some(value), Some(average)) = (row.direct_kill, averages.direct_kill) {
        scores.push(dimension_score(value, average, true));
    }
    if let (Some(value), Some(average)) = (row.eco_destruction, averages.eco_destruction) {
        scores.push(dimension_score(value, average, true));
    }

    if scores.is_empty() {
        return None;
    }
    let mean = scores.iter().sum::<f64>() / scores.len() as f64;
    Some(mean.clamp(0.0, 100.0))
}

fn dimension_score(value: f64, column_average: f64, lower_is_better: bool) -> f64 {
    if column_average <= 0.0 || value <= 0.0 {
        return 50.0;
    }
    let raw_score = if lower_is_better {
        50.0 * (column_average / value)
    } else {
        50.0 * (value / column_average)
    };
    raw_score.clamp(0.0, 100.0)
}
