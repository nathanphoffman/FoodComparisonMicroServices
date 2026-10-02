use crate::models::{FoodRow, NutritionWeights};

/// Nutrition score per 100 kcal. Foods with no calories (diet soda, water) score 0 —
/// they add nothing good or bad.
pub(super) fn compute_nutrition_score(food: &FoodRow, weights: &NutritionWeights) -> Option<f64> {
    if food.calories <= 0.0 {
        return Some(0.0);
    }
    let free_sugar = (food.sugar.unwrap_or(0.0) - weights.sugar_allowance * food.fiber).max(0.0);
    let raw = weights.protein * food.protein + weights.fiber * food.fiber
        - weights.sat_fat * food.sat_fat
        - weights.free_sugar * free_sugar
        // sodium is mg per gram and its weight is per 100 mg
        - weights.sodium * food.sodium.unwrap_or(0.0) / 100.0
        + weights.micronutrients * food.micronutrients.as_ref().map_or(0.0, |m| m.daily_value_fraction());

    Some(raw * 100.0 / food.calories)
}
