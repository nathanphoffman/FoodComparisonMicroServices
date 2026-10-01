use crate::models::FoodRow;

const FIBER_SCORE_WEIGHT: f64 = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;
/// Grams of sugar per gram of fiber still treated as "whole food" sugar (fruit).
/// Only sugar beyond this is penalised, so table sugar and syrups lose points
/// but whole fruit barely moves.
const SUGAR_FIBER_ALLOWANCE: f64 = 5.0;
const FREE_SUGAR_SCORE_PENALTY: f64 = 0.25;
/// Milligrams of sodium (per 100 kcal, like the rest of the score) that cost one point.
const SODIUM_MG_PER_SCORE_POINT: f64 = 50.0;
/// Points per full daily value of each vitamin/mineral, per 100 kcal. Linear, no cap.
const MICRONUTRIENT_SCORE_WEIGHT: f64 = 1.0;

/// Nutrition score per 100 kcal. None for foods with no calories.
pub(super) fn compute_nutrition_score(food: &FoodRow) -> Option<f64> {
    if food.calories <= 0.0 {
        return None;
    }
    let free_sugar = (food.sugar.unwrap_or(0.0) - SUGAR_FIBER_ALLOWANCE * food.fiber).max(0.0);
    let raw = food.protein + FIBER_SCORE_WEIGHT * food.fiber
        - SAT_FAT_SCORE_PENALTY * food.sat_fat
        - FREE_SUGAR_SCORE_PENALTY * free_sugar
        // sodium is mg per gram, the rest g per gram — scaled the same way below
        - food.sodium.unwrap_or(0.0) / SODIUM_MG_PER_SCORE_POINT
        + MICRONUTRIENT_SCORE_WEIGHT * food.micronutrients.as_ref().map_or(0.0, |m| m.daily_value_fraction());

    // nutrition score should be flat, not weighted by a divisor it is absolute
    Some(raw * 100.0 / food.calories)
}
