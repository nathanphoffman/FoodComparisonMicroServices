use serde::Serialize;

// Serialised with camelCase to match the existing TypeScript detail types in
// FoodTableTypes.ts, so FoodTableTooltips.tsx needs no changes.

/// Per-gas breakdown of greenhouse gas emissions (all in kg CO₂e per kg food).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmissionsBreakdown {
    pub co2: f64,
    pub ch4: f64,
    pub n2o: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feed_emissions: Option<f64>,
}

/// Raw (unweighted) water footprint components (L per kg food).
/// Slider weighting is applied client-side in WaterTooltip.
#[derive(Debug, Clone, Serialize)]
pub struct WaterDetail {
    pub green: Option<f64>,
    pub blue:  Option<f64>,
    pub grey:  Option<f64>,
}

/// Land use breakdown for tooltip display.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LandUseDetail {
    #[serde(rename = "type")]
    pub land_type:                    String,   // "plant" | "animal"
    pub yield_kilograms_per_hectare:  Option<f64>,
    pub pasture_hectares_per_kilogram: Option<f64>,
    pub feed_land_m2_per_kg:          Option<f64>,
}

/// Per-species/source breakdown of sentient harm score (pre-combination values).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SentientHarmDetail {
    pub direct_kill_score:           f64,
    pub insect_score:                f64,
    pub bee_score:                   f64,
    pub worm_score:                  f64,
    pub deforestation_score:         f64,
    pub feed_insect_score:           f64,
    pub feed_bee_score:              f64,
    pub feed_worm_score:             f64,
    pub feed_deforestation_score:    f64,
    pub pasture_deforestation_score: f64,
    pub bycatch_score:               f64,
}

impl SentientHarmDetail {
    pub fn zero() -> Self {
        SentientHarmDetail {
            direct_kill_score: 0.0,
            insect_score: 0.0, bee_score: 0.0, worm_score: 0.0, deforestation_score: 0.0,
            feed_insect_score: 0.0, feed_bee_score: 0.0, feed_worm_score: 0.0,
            feed_deforestation_score: 0.0, pasture_deforestation_score: 0.0, bycatch_score: 0.0,
        }
    }
}

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
    pub sentient_harm:   Option<f64>,
    pub final_score:     Option<f64>,

    // Tooltip breakdown details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emissions_breakdown:  Option<EmissionsBreakdown>,
    pub water_detail:         WaterDetail,
    pub land_use_detail:      LandUseDetail,
    pub sentient_harm_detail: SentientHarmDetail,
}
