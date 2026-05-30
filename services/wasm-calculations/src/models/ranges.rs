/// Log-space min/max for a single column, used for log-min-max normalization.
/// log_min = ln(smallest positive value) — best food on lower-is-better dimensions.
/// log_max = ln(largest positive value)  — worst food on lower-is-better dimensions.
#[derive(Debug, Clone, Copy)]
pub struct ColumnRange {
    pub log_min: f64,
    pub log_max: f64,
}

/// Per-column log ranges used for relative scoring.
#[derive(Debug)]
pub struct ColumnRanges {
    pub emissions:       Option<ColumnRange>,
    pub land_use:        Option<ColumnRange>,
    pub water:           Option<ColumnRange>,
    pub direct_kill:     Option<ColumnRange>,
    pub nutrition_score: Option<ColumnRange>,
    pub sentient_harm:   Option<ColumnRange>,
}
