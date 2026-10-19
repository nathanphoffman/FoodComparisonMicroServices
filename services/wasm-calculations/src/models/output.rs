use serde::Serialize;

use super::detail::{EmissionsBreakdown, ImprovementDetail, KillDetail, LandUseDetail, SentientHarmDetail, WaterDetail};

/// Scored row returned to the browser after WASM calculation.
/// Contains both the aggregate scores used for sorting/display and the
/// breakdown details used for tooltips. Divisor is included so the TypeScript
/// side never needs to recompute it.
#[derive(Debug, Clone, Serialize)]
pub struct ScoredRow {
    pub name:      String,
    pub slug:      String,
    pub food_type: String,
    pub divisor:   f64,

    // Aggregate scores (used for column values and sorting)
    pub nutrition_score: Option<f64>,
    pub emissions:       Option<f64>,
    pub land_use:        Option<f64>,
    pub water:           Option<f64>,
    pub direct_kill:     Option<f64>,
    pub captive_sentience: Option<f64>,
    pub sentient_harm:   Option<f64>,
    pub final_score:     Option<f64>,
    pub availability:    Option<f64>,

    // Tooltip breakdown details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emissions_breakdown:  Option<EmissionsBreakdown>,
    pub water_detail:         WaterDetail,
    pub land_use_detail:      LandUseDetail,
    pub sentient_harm_detail: SentientHarmDetail,
    pub kill_detail:          Option<KillDetail>,
    /// Wild fish killed per kg for fishmeal / fish oil (for the tooltip); None if none.
    pub wild_fish_deaths_per_kg: Option<f64>,
    /// Intelligence-weighted kill of those wild fish, per kg (part of direct kill); 0 if none.
    pub wild_fish_kill: f64,
    /// Breakdown of final_score; None when final_score is None.
    pub improvement_detail: Option<ImprovementDetail>,
}
