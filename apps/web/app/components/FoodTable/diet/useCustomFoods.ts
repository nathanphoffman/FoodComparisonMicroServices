import { useState, useMemo, useCallback } from 'react';
import { blendNutritionDetail } from '../nutrition/FoodTableCalculations';
import { averageDietInput } from './FoodTableAverageDiet';
import type { CustomFoodInput, RawFood } from '../Types/FoodTableTypes';

/** The user's custom meal / diet, plus the hidden benchmark diet that is scored with it. */
export function useCustomFoods(rawFoods: RawFood[]) {
    // Keyed by slug so each builder can report on its own
    const [customFoodsBySlug, setCustomFoodsBySlug] = useState<Record<string, CustomFoodInput>>({});
    const customFoods = useMemo(() => Object.values(customFoodsBySlug), [customFoodsBySlug]);
    const onCustomFoodChange = useCallback(
        (food: CustomFoodInput) => setCustomFoodsBySlug(previous => ({ ...previous, [food.slug]: food })),
        [],
    );

    const foodSlugs = useMemo(() => new Set(rawFoods.map(food => food.slug)), [rawFoods]);
    // The benchmark diet is scored alongside the user's, but never shown as a table row
    const averageDiet = useMemo(() => foodSlugs.size > 0 ? averageDietInput(foodSlugs) : null, [foodSlugs]);
    const scoredCustomFoods = useMemo(() => averageDiet ? [...customFoods, averageDiet] : customFoods, [customFoods, averageDiet]);

    // Combined nutrition for the custom foods' tooltips
    const customNutrition = useMemo(() => new Map(
        customFoods.map(custom => [custom.slug, blendNutritionDetail(custom, rawFoods)]),
    ), [customFoods, rawFoods]);

    return { customFoodsBySlug, onCustomFoodChange, foodSlugs, averageDiet, scoredCustomFoods, customNutrition };
}
