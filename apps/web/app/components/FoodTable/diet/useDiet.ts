import { useState, useMemo } from 'react';
import { blendDietNutrition } from '../nutrition/FoodTableCalculations';
import { averageDietInput } from './FoodTableAverageDiet';
import type { DietInput, RawFood } from '../types/FoodTableTypes';

/** The diet being planned, plus the hidden benchmark diet that is scored with it. */
export function useDiet(rawFoods: RawFood[]) {
    // null until the builder reports its saved diet on load
    const [diet, setDiet] = useState<DietInput | null>(null);

    const foodSlugs = useMemo(() => new Set(rawFoods.map(food => food.slug)), [rawFoods]);

    // The benchmark diet is scored alongside the user's, but never shown as a table row
    const averageDiet = useMemo(() => foodSlugs.size > 0 ? averageDietInput(foodSlugs) : null, [foodSlugs]);
    const scoredDiets = useMemo(
        () => [diet, averageDiet].filter((scored): scored is DietInput => scored !== null),
        [diet, averageDiet],
    );

    // Combined nutrition for the diet's tooltip
    const dietNutrition = useMemo(() => diet ? blendDietNutrition(diet, rawFoods) : null, [diet, rawFoods]);

    return { diet, onDietChange: setDiet, foodSlugs, averageDiet, scoredDiets, dietNutrition };
}
