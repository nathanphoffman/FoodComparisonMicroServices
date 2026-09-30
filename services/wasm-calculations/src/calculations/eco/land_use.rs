use super::constants::SQUARE_METERS_PER_HA;
use crate::models::{FoodRow, LandUseDetail, SliderQuery};

/// Returns (raw m²/kg, weighted m²/kg, detail). The weighted value scales raw area
/// by the Land Use slider weights for this food's land types; it only feeds the
/// Land Use column/score. Land-driven deaths and availability use raw area.
pub(in crate::calculations) fn compute_land_use(food: &FoodRow, query: &SliderQuery) -> (f64, f64, LandUseDetail) {
    let multiplier = food
        .land_types
        .as_ref()
        .map_or(1.0, |split| split.multiplier(&query.land_type_weights));

    if food.food_type == "plant" {
        let land_use = food
            .yield_kg_ha
            .filter(|&y| y > 0.0)
            .map(|y| SQUARE_METERS_PER_HA / y)
            .unwrap_or(0.0);
        let detail = LandUseDetail {
            land_type: "plant".to_string(),
            yield_kilograms_per_hectare: food.yield_kg_ha,
            pasture_hectares_per_kilogram: None,
            feed_land_m2_per_kg: None,
            raw_m2_per_kg: land_use,
            land_types: food.land_types.clone(),
            multiplier,
        };
        return (land_use, land_use * multiplier, detail);
    }

    let pasture_land_m2 = food
        .pasture_ha_per_kg_output
        .map(|ha| ha * SQUARE_METERS_PER_HA)
        .unwrap_or(0.0);
    let total = pasture_land_m2 + food.feed_land_m2_per_kg.unwrap_or(0.0);
    let detail = LandUseDetail {
        land_type: "animal".to_string(),
        yield_kilograms_per_hectare: None,
        pasture_hectares_per_kilogram: food.pasture_ha_per_kg_output,
        feed_land_m2_per_kg: food.feed_land_m2_per_kg,
        raw_m2_per_kg: total,
        land_types: food.land_types.clone(),
        multiplier,
    };
    (total, total * multiplier, detail)
}
