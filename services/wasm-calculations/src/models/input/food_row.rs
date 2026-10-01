use serde::Deserialize;

use super::land_types::LandTypes;

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

    // Wild fish killed for fishmeal / fish oil — per kg of product, or summed
    // over an animal's feed. Intentional kills, so they count as direct kill.
    pub wild_fish_kg_per_kg:      Option<f64>,
    pub wild_fish_neuron_count:   Option<f64>,
    pub wild_fish_weight_kg:      Option<f64>,
    pub wild_fish_lifespan_years: Option<f64>,

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

    // "wild" marks hunted/fished animals and gathered plants (Over-Hunting / Over-Gathering sliders).
    #[serde(default)]
    pub tags: Vec<String>,
}
