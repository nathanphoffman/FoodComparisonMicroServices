use serde::Deserialize;

/// Nutrition sliders: how many points each nutrient adds to (or takes from) the
/// Nutrition score. All per 100 g of food; the score is then scaled to per 100 kcal.
// Keep in sync with DEFAULT_NUTRITION_WEIGHTS in FoodTableDefaults.ts.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct NutritionWeights {
    pub protein:          f64, // points per g of protein (helps)
    pub fiber:            f64, // points per g of fiber (helps)
    pub micronutrients:   f64, // points per full daily value of a vitamin/mineral (helps)
    pub sat_fat:          f64, // points lost per g of saturated fat (harms)
    pub free_sugar:       f64, // points lost per g of sugar beyond the fiber allowance (harms)
    /// Grams of sugar per gram of fiber still treated as "whole food" sugar (fruit).
    /// Only sugar beyond this is penalised, so table sugar and syrups lose points
    /// but whole fruit barely moves.
    pub sugar_allowance:  f64,
    pub sodium:           f64, // points lost per 100 mg of sodium (harms)
}

impl Default for NutritionWeights {
    fn default() -> Self {
        Self {
            protein:         1.0,
            fiber:           2.0,
            micronutrients:  2.0,
            sat_fat:         2.0,
            free_sugar:      0.25,
            sugar_allowance: 5.0,
            sodium:          2.0,
        }
    }
}
