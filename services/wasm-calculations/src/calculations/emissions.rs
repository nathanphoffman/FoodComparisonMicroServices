use crate::models::FoodRow;

// ── GWP conversion factors (matching FoodTableCalculations.ts) ────────────────
const GWP_CH4: f64 = 28.0;
const GWP_N2O: f64 = 265.0;

pub(super) fn compute_emissions(food: &FoodRow) -> f64 {
    if food.food_type == "animal" {
        if let (Some(ch4), Some(n2o), Some(co2)) = (
            food.ch4_kg_per_kg_output,
            food.n2o_kg_per_kg_output,
            food.co2_kg_per_kg_output,
        ) {
            // Apply GWP factors to get CO₂e, matching FoodTableCalculations.ts:
            // ch4Co2e = ch4 * 28, n2oCo2e = n2o * 265
            return co2
                + ch4 * GWP_CH4
                + n2o * GWP_N2O
                + food.feed_emissions_per_kg.unwrap_or(0.0);
        }
    }
    food.emissions_per_kg.unwrap_or(0.0)
}
