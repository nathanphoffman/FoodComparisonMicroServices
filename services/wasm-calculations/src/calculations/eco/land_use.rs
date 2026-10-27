use super::constants::SQUARE_METERS_PER_HA;
use crate::models::{FoodRow, LandUseDetail, SliderQuery, FOOD_TYPE_ANIMAL, FOOD_TYPE_PLANT};

/// Returns (raw m²/kg, weighted m²/kg, detail). The weighted value scales raw area
/// by the Land Use slider weights for this food's land types; it only feeds the
/// Land Use column/score. Land-driven deaths and availability use raw area.
pub(in crate::calculations) fn compute_land_use(food: &FoodRow, query: &SliderQuery) -> (f64, f64, LandUseDetail) {
    let multiplier = food
        .land_types
        .as_ref()
        .map_or(1.0, |split| split.multiplier(&query.land_type_weights));

    let detail = if food.food_type == FOOD_TYPE_PLANT {
        plant_land_use(food, multiplier)
    } else {
        animal_land_use(food, multiplier)
    };

    (detail.raw_m2_per_kg, detail.raw_m2_per_kg * multiplier, detail)
}

/// A plant's land is one hectare's worth of area divided by its yield.
fn plant_land_use(food: &FoodRow, multiplier: f64) -> LandUseDetail {
    let area = food
        .yield_kg_ha
        .filter(|&yield_kg_ha| yield_kg_ha > 0.0)
        .map(|yield_kg_ha| SQUARE_METERS_PER_HA / yield_kg_ha)
        .unwrap_or(0.0);

    LandUseDetail {
        land_type: FOOD_TYPE_PLANT.to_string(),
        yield_kilograms_per_hectare: food.yield_kg_ha,
        pasture_hectares_per_kilogram: None,
        feed_land_m2_per_kg: None,
        raw_m2_per_kg: area,
        land_types: food.land_types.clone(),
        multiplier,
    }
}

/// An animal's land is its pasture plus the cropland that grows its feed.
fn animal_land_use(food: &FoodRow, multiplier: f64) -> LandUseDetail {
    let pasture_land_m2 = food
        .pasture_ha_per_kg_output
        .map(|ha| ha * SQUARE_METERS_PER_HA)
        .unwrap_or(0.0);

    LandUseDetail {
        land_type: FOOD_TYPE_ANIMAL.to_string(),
        yield_kilograms_per_hectare: None,
        pasture_hectares_per_kilogram: food.pasture_ha_per_kg_output,
        feed_land_m2_per_kg: food.feed_land_m2_per_kg,
        raw_m2_per_kg: pasture_land_m2 + food.feed_land_m2_per_kg.unwrap_or(0.0),
        land_types: food.land_types.clone(),
        multiplier,
    }
}
