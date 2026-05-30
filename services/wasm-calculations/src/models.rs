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

    // Bycatch — fishing collateral kill (NULL for non-seafood or no bycatch data)
    pub bycatch_amount:       Option<f64>, // kg of bycatch animal per kg of this food
    pub bycatch_food_slug:    Option<String>, // slug of the bycatch species (for lifespan lookup)
    pub bycatch_neuron_count: Option<f64>,
    pub bycatch_weight_kg:    Option<f64>,

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
    #[serde(default = "default_neuron_exponent")]
    pub neuron_exponent: f64, // exponent applied to neuron count in intelligence calc (default 1.5)
    #[serde(default = "default_weight_exponent")]
    pub weight_exponent: f64, // exponent applied to body weight in intelligence calc (default 0.75)
    #[serde(default = "default_final_intelligence_exponent")]
    pub final_intelligence_exponent: f64, // final nonlinear curve applied to intelligence score (1.0–1.5, default 1.0)
}

fn default_calorie_weight()               -> f64 { 34.0 }
fn default_protein_weight()               -> f64 { 33.0 }
fn default_mass_weight()                  -> f64 { 33.0 }
fn default_green_water()                  -> f64 { 25.0 }
fn default_grey_water()                   -> f64 { 25.0 }
fn default_kill_multiplier()              -> f64 { 1.0 }
fn default_neuron_exponent()              -> f64 { 1.5 }
fn default_weight_exponent()              -> f64 { 0.75 }
fn default_final_intelligence_exponent()  -> f64 { 1.0 }

/// Single input object bundling all foods + slider state into one WASM call.
/// Keeps the JS/Rust boundary simple — one object in, one array out.
#[derive(Debug, Deserialize)]
pub struct ScoreInput {
    pub foods: Vec<FoodRow>,
    pub query: SliderQuery,
}

// ── Breakdown detail structs ─────────────────────────────────────────────────
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

/// Per-species/source breakdown of eco destruction score (pre-combination values).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EcoDestructionDetail {
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

impl EcoDestructionDetail {
    pub fn zero() -> Self {
        EcoDestructionDetail {
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
    pub eco_destruction: Option<f64>,
    pub final_score:     Option<f64>,

    // Tooltip breakdown details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emissions_breakdown:    Option<EmissionsBreakdown>,
    pub water_detail:           WaterDetail,
    pub land_use_detail:        LandUseDetail,
    pub eco_destruction_detail: EcoDestructionDetail,
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
pub struct ColumnRanges {
    pub emissions:       Option<ColumnRange>,
    pub land_use:        Option<ColumnRange>,
    pub water:           Option<ColumnRange>,
    pub direct_kill:     Option<ColumnRange>,
    pub nutrition_score: Option<ColumnRange>,
    pub eco_destruction: Option<ColumnRange>,
}
