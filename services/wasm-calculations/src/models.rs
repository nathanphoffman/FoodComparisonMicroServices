use serde::{Deserialize, Serialize};

/// Raw food row returned by the C# data API (GET /api/foods).
/// Field names are snake_case to match the JSON output from the C# API
/// (configured with JsonNamingPolicy.SnakeCaseLower).
/// Fields unused by the current calculations are kept for completeness of the
/// data shape — future calculations (pesticides, nutrition detail) will use them.
#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct FoodRow {
    pub name: String,
    pub slug: String,
    #[serde(rename = "type")]
    pub food_type: String, // "plant" | "animal"

    // Nutrition (per 100 g serving)
    pub calories: f64,
    pub fat:      f64,
    pub protein:  f64,
    pub fiber:    f64,
    pub sat_fat:  f64,
    pub sodium:       Option<f64>,
    pub carbs:        Option<f64>,
    pub sugar:        Option<f64>,
    pub cholesterol:  Option<f64>,
    pub trans_fat:    Option<f64>,

    // Plant metrics
    pub yield_kg_ha:               Option<f64>,
    pub emissions_per_kg:          Option<f64>,
    pub water_per_kg:              Option<f64>,
    pub green_water_per_kg:        Option<f64>,
    pub blue_water_per_kg:         Option<f64>,
    pub grey_water_per_kg:         Option<f64>,
    pub pesticide_insect_paf:      Option<f64>,
    pub pesticide_terrestrial_paf: Option<f64>,
    pub pesticide_bee_hazard:      Option<f64>,
    pub pesticide_kg_per_kg_food:  Option<f64>,

    // Animal metrics (neuron_count is 0 for non-animal rows in the TS type)
    pub neuron_count:              Option<f64>,
    pub weight_kg:                 Option<f64>,
    pub yield_fraction:            Option<f64>,
    pub pasture_ha_per_kg_output:  Option<f64>,
    pub ch4_kg_per_kg_output:      Option<f64>,
    pub n2o_kg_per_kg_output:      Option<f64>,
    pub co2_kg_per_kg_output:      Option<f64>,

    // Feed aggregate columns (self-join result in the DB query)
    pub feed_water_per_kg:              Option<f64>,
    pub feed_emissions_per_kg:          Option<f64>,
    pub feed_green_water_per_kg:        Option<f64>,
    pub feed_blue_water_per_kg:         Option<f64>,
    pub feed_grey_water_per_kg:         Option<f64>,
    pub feed_pesticide_insect_paf:      Option<f64>,
    pub feed_pesticide_terrestrial_paf: Option<f64>,
    pub feed_pesticide_bee_hazard:      Option<f64>,
    pub feed_pesticide_kg_per_kg_food:  Option<f64>,
    pub feed_land_m2_per_kg:            Option<f64>,
}

/// Slider state sent from the Next.js FoodTable component.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SliderQuery {
    #[serde(default = "default_calorie_weight")]
    pub calorie_weight: f64,  // 0–100 (default 34)
    #[serde(default = "default_protein_weight")]
    pub protein_weight: f64,  // 0–100 (default 33)
    #[serde(default = "default_mass_weight")]
    pub mass_weight:    f64,  // 0–100 (default 33)
    #[serde(default = "default_green_water")]
    pub green_water:    f64,  // 0–100 (default 25)
    #[serde(default = "default_grey_water")]
    pub grey_water:     f64,  // 0–100 (default 25)
    #[serde(default = "default_kill_multiplier")]
    pub kill_multiplier: f64, // 1–10000 (default 1)
}

fn default_calorie_weight()  -> f64 { 34.0 }
fn default_protein_weight()  -> f64 { 33.0 }
fn default_mass_weight()     -> f64 { 33.0 }
fn default_green_water()     -> f64 { 25.0 }
fn default_grey_water()      -> f64 { 25.0 }
fn default_kill_multiplier() -> f64 { 1.0 }

/// Scored row returned to the browser after WASM calculation.
#[derive(Debug, Clone, Serialize)]
pub struct ScoredRow {
    pub name:            String,
    pub slug:            String,
    pub food_type:       String,
    pub nutrition_score: Option<f64>,
    pub emissions:       Option<f64>,
    pub land_use:        Option<f64>,
    pub water:           Option<f64>,
    pub direct_kill:     Option<f64>,
    pub eco_destruction: Option<f64>,
    pub final_score:     Option<f64>,
}

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
pub struct Averages {
    pub emissions:       Option<ColumnRange>,
    pub land_use:        Option<ColumnRange>,
    pub water:           Option<ColumnRange>,
    pub direct_kill:     Option<ColumnRange>,
    pub nutrition_score: Option<ColumnRange>,
    pub eco_destruction: Option<ColumnRange>,
}
