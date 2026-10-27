use crate::models::{EmissionsBreakdown, FoodRow, FOOD_TYPE_ANIMAL};

// Global warming potentials: how many times more a kg of methane or nitrous oxide warms than a kg of CO2, over 100 years.
// The web app shows copies of these in its working (FoodDetail/figures/math/MathShared.ts);
// ConstantsInSync.test.ts fails if they drift apart.
const GWP_CH4: f64 = 28.0;
const GWP_N2O: f64 = 265.0;

/// Greenhouse gas per kg in CO2-equivalent, with a per-gas breakdown for animals that have all three gases recorded.
pub(super) fn compute_emissions(food: &FoodRow) -> (f64, Option<EmissionsBreakdown>) {
    if food.food_type == FOOD_TYPE_ANIMAL {
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
