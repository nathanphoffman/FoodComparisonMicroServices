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
    pub lifetime_output_kg:        Option<f64>,
    // Offspring killed per producing animal (dairy calves, culled male chicks),
    // scored as the same species as the parent.
    pub offspring_deaths_per_animal: Option<f64>,
    pub offspring_captivity_years:   Option<f64>,
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

    // Global supply availability
    pub availability_gg: Option<f64>,

    // Fraction of this food's land in each land type (sums to 1); None for foods
    // with no farmland (seafood, wild foods).
    #[serde(default)]
    pub land_types: Option<LandTypes>,
}

/// One value per broad land type. Used both for a food's land split (fractions)
/// and for the Land Use slider weights (multipliers, 1.0 = neutral).
/// Keys are snake_case everywhere — food data, slider query and tooltip detail.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct LandTypes {
    pub tropical_forest:     f64,
    pub tropical_savanna:    f64,
    pub temperate_grassland: f64,
    pub temperate_forest:    f64,
    pub dry:                 f64,
    pub wetland:             f64,
}

impl LandTypes {
    fn values(&self) -> [f64; 6] {
        [
            self.tropical_forest, self.tropical_savanna, self.temperate_grassland,
            self.temperate_forest, self.dry, self.wetland,
        ]
    }

    /// Weighted average of `weights` over this split. Returns 1.0 (neutral)
    /// for an empty split.
    pub fn multiplier(&self, weights: &LandTypes) -> f64 {
        let total: f64 = self.values().iter().sum();
        if total <= 0.0 {
            return 1.0;
        }
        let weighted: f64 = self.values().iter().zip(weights.values()).map(|(f, w)| f * w).sum();
        weighted / total
    }
}

/// Slider state sent from the Next.js FoodTable component.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SliderQuery {
    #[serde(default = "default_calorie_weight")]
    pub calorie_weight: f64,  // 0–100 (default 50)
    #[serde(default = "default_protein_weight")]
    pub protein_weight: f64,  // 0–100 (default 20)
    #[serde(default)]
    pub dry_mass_weight: f64, // 0–100 (UI default 20; 0 if omitted): weight without water
    #[serde(default)]
    pub wet_mass_weight: f64, // 0–100 (UI default 10; 0 if omitted): weight as eaten (cooked for beans/grains)
    #[serde(default = "default_green_water")]
    pub green_water:    f64,  // 0–100 (default 25)
    #[serde(default = "default_grey_water")]
    pub grey_water:     f64,  // 0–100 (default 25)
    #[serde(default = "default_kill_multiplier")]
    pub kill_multiplier: f64, // 0–1000 (default 1)
    #[serde(default = "default_captivity_multiplier")]
    pub captivity_multiplier: f64, // deaths-equivalent per year in captivity (0.01–10, default 1)
    #[serde(default = "default_neuron_exponent")]
    pub neuron_exponent: f64, // exponent applied to neuron count in intelligence calc (default 1.5)
    #[serde(default = "default_weight_exponent")]
    pub weight_exponent: f64, // exponent applied to body weight in intelligence calc (default 0.75)
    #[serde(default = "default_final_intelligence_exponent")]
    pub final_intelligence_exponent: f64, // final nonlinear curve applied to intelligence score (1.0–1.5, default 1.0)
    #[serde(default)]
    pub reference_slug: Option<String>,
    #[serde(default = "default_zero_better_multiplier")]
    pub zero_better_multiplier: f64, // how many times better a zero score is vs the next best (default 2.0)
    #[serde(default)]
    pub meal_ingredients: Vec<MealIngredient>,

    // Score priorities: how much each measure counts toward the Improvement score.
    // 0–100, sum to 100 in the UI; only their relative size matters here.
    #[serde(default = "default_priority")]
    pub nutrition_priority:    f64,
    #[serde(default = "default_priority")]
    pub emissions_priority:    f64,
    #[serde(default = "default_priority")]
    pub intelligence_priority: f64,
    #[serde(default = "default_priority")]
    pub water_priority:        f64,
    #[serde(default = "default_priority")]
    pub land_use_priority:     f64,
    #[serde(default = "default_priority")]
    pub availability_priority: f64,

    // Land Use sliders: how much a m² of each land type counts toward the Land Use
    // score. Doesn't affect land-driven deaths or availability, which use raw area.
    #[serde(default = "default_land_type_weights")]
    pub land_type_weights: LandTypes,

    // How much a big win in one measure is dampened when combining measures into
    // the Improvement score: 0 = linear (arithmetic mean), 1 = geometric mean
    // (default, the original behavior), 2 = harmonic mean (weakest measure dominates).
    #[serde(default = "default_win_dampening")]
    pub win_dampening: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MealIngredient {
    pub slug:     String,
    pub fraction: f64,
}

fn default_zero_better_multiplier() -> f64 { 2.0 }
fn default_priority()               -> f64 { 1.0 }
fn default_win_dampening()          -> f64 { 1.0 }

// Keep in sync with DEFAULT_LAND_TYPE_WEIGHTS in LandTypeSliders.tsx.
fn default_land_type_weights() -> LandTypes {
    LandTypes {
        tropical_forest:     3.0,
        wetland:             2.0,
        tropical_savanna:    1.5,
        temperate_forest:    1.0,
        dry:                 1.0,
        temperate_grassland: 0.75,
    }
}

fn default_calorie_weight()               -> f64 { 50.0 }
fn default_protein_weight()               -> f64 { 20.0 }
fn default_green_water()                  -> f64 { 25.0 }
fn default_grey_water()                   -> f64 { 25.0 }
fn default_kill_multiplier()              -> f64 { 1.0 }
fn default_captivity_multiplier()         -> f64 { 1.0 }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn land_type_multiplier() {
        let weights = default_land_type_weights();

        let palm = LandTypes { tropical_forest: 0.85, wetland: 0.15, ..Default::default() };
        assert!((palm.multiplier(&weights) - 2.85).abs() < 1e-9);

        let wheat = LandTypes { temperate_grassland: 1.0, ..Default::default() };
        assert!((wheat.multiplier(&weights) - 0.75).abs() < 1e-9);

        // no split → neutral
        assert_eq!(LandTypes::default().multiplier(&weights), 1.0);

        // all weights at 1.0 → neutral regardless of split
        let ones = LandTypes {
            tropical_forest: 1.0, tropical_savanna: 1.0, temperate_grassland: 1.0,
            temperate_forest: 1.0, dry: 1.0, wetland: 1.0,
        };
        assert!((palm.multiplier(&ones) - 1.0).abs() < 1e-9);
    }
}
