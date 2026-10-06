use serde::Deserialize;

use super::land_types::LandTypes;
use super::nutrition_weights::NutritionWeights;

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
    pub custom_foods: Vec<CustomFood>, // user-built composites (custom meal, diet) scored as extra rows

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

    // Nutrition sliders: points per nutrient in the Nutrition score.
    #[serde(default)]
    pub nutrition_weights: NutritionWeights,

    // How much a big win in one measure is dampened when combining measures into
    // the Improvement score: 0 = linear (arithmetic mean), 1 = geometric mean
    // (default, the original behavior), 2 = harmonic mean (weakest measure dominates).
    #[serde(default = "default_win_dampening")]
    pub win_dampening: f64,

    // Final-score divisors for foods tagged "wild": how many times more we hunt
    // (animals) or gather (plants) than is sustainable. 1 = no penalty.
    #[serde(default = "default_over_hunting_factor")]
    pub over_hunting_factor: f64,
    #[serde(default = "default_over_gathering_factor")]
    pub over_gathering_factor: f64,
}

/// What an ingredient's fraction is a share of.
#[derive(Debug, Clone, Copy, Default, PartialEq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Basis {
    #[default]
    Calories,
    Mass,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MealIngredient {
    pub slug:     String,
    pub fraction: f64,
}

/// A composite row the user builds from foods, e.g. "Your Meal" or "Your Diet".
#[derive(Debug, Clone, Deserialize)]
pub struct CustomFood {
    pub slug:        String,
    pub name:        String,
    #[serde(default)]
    pub basis:       Basis,
    pub ingredients: Vec<MealIngredient>,
}

fn default_zero_better_multiplier() -> f64 { 2.0 }
fn default_priority()               -> f64 { 1.0 }
fn default_win_dampening()          -> f64 { 1.0 }
// Keep in sync with DEFAULT_OVER_HUNTING / DEFAULT_OVER_GATHERING in OverHuntingSlider.tsx / OverGatheringSlider.tsx.
fn default_over_hunting_factor()    -> f64 { 2.5 }
fn default_over_gathering_factor()  -> f64 { 1.5 }

// Keep in sync with DEFAULT_LAND_TYPE_WEIGHTS in LandTypeSliders.tsx.
// Chaudhary & Brooks (2018) biodiversity factors per biome, relative to temperate forest.
pub(super) fn default_land_type_weights() -> LandTypes {
    LandTypes {
        tropical_forest:     10.0,
        wetland:             1.8,
        tropical_savanna:    1.2,
        temperate_forest:    1.0,
        dry:                 0.85,
        temperate_grassland: 0.45,
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
