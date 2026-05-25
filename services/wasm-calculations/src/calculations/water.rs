use crate::models::{FoodRow, SliderQuery};

pub(super) fn effective_water(food: &FoodRow, query: &SliderQuery) -> f64 {
    let (green_water, blue_water, grey_water) = if food.food_type == "animal" {
        (food.feed_green_water_per_kg, food.feed_blue_water_per_kg, food.feed_grey_water_per_kg)
    } else {
        (food.green_water_per_kg, food.blue_water_per_kg, food.grey_water_per_kg)
    };

    if let (Some(green), Some(blue)) = (green_water, blue_water) {
        return blue
            + (query.green_water / 100.0) * green
            + (query.grey_water  / 100.0) * grey_water.unwrap_or(0.0);
    }

    if food.food_type == "animal" {
        food.feed_water_per_kg.unwrap_or(0.0)
    } else {
        food.water_per_kg.unwrap_or(0.0)
    }
}
