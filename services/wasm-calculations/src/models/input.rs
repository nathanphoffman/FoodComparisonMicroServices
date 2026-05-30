use serde::Deserialize;

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
    pub cooked_weight_ratio:       Option<f64>,
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
