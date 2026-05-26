use crate::models::{EmissionsBreakdown, FoodRow};

// ── GWP conversion factors (matching FoodTableCalculations.ts) ────────────────
const GWP_CH4: f64 = 28.0;
const GWP_N2O: f64 = 265.0;

pub(super) fn compute_emissions(food: &FoodRow) -> (f64, Option<EmissionsBreakdown>) {
    if food.food_type == "animal" {
        if let (Some(ch4), Some(n2o), Some(co2)) = (
            food.ch4_kg_per_kg_output,
            food.n2o_kg_per_kg_output,
            food.co2_kg_per_kg_output,
        ) {
            let ch4_co2e  = ch4 * GWP_CH4;
            let n2o_co2e  = n2o * GWP_N2O;
            let feed      = food.feed_emissions_per_kg;
            let total     = co2 + ch4_co2e + n2o_co2e + feed.unwrap_or(0.0);
            let breakdown = EmissionsBreakdown { co2, ch4: ch4_co2e, n2o: n2o_co2e, feed_emissions: feed };
            return (total, Some(breakdown));
        }
    }
    (food.emissions_per_kg.unwrap_or(0.0), None)
}
