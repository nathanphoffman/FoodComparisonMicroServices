import { MICRONUTRIENT_KEYS, AMINO_ACID_KEYS, type RawFood, type DietInput, type Micronutrients, type AminoAcids, type IntelligenceDetail, type NutritionDetail } from '../../types/FoodTableTypes';
import { sumOf } from '@/lib/sumOf';

// Tooltip detail types: pure passthroughs from the raw data, plus the blends for a diet.

export function toNutritionDetail(food: RawFood): NutritionDetail {
    return {
        calories:     food.calories,
        fat:          food.fat,
        saturatedFat: food.sat_fat,
        transFat:     food.trans_fat,
        cholesterol:  food.cholesterol,
        sodium:       food.sodium,
        carbs:        food.carbs,
        fiber:        food.fiber,
        sugar:        food.sugar,
        protein:      food.protein,
        micronutrients: food.micronutrients,
        aminoAcids:   food.amino_acids,
    };
}

/** Each ingredient that's in the food list with a positive share, with its mass; a calorie share becomes mass by dividing by calories per gram (same as the WASM blend). */
function ingredientMasses(diet: DietInput, foods: RawFood[]): { food: RawFood; mass: number }[] {
    return diet.ingredients.flatMap(({ slug, fraction }) => {
        const food = foods.find(candidate => candidate.slug === slug);

        if (!food || fraction <= 0) return [];
        let mass = fraction;

        if (diet.basis !== 'mass') mass = food.calories > 0 ? fraction / food.calories : 0;

        return mass > 0 ? [{ food, mass }] : [];
    });
}

/**
 * Combined nutrition (per gram) of a diet: each ingredient's per-gram
 * values weighted by its share of the mass. A calorie share is turned into mass by
 * dividing by the food's calories per gram (same as the WASM blend).
 * Optional nutrients are shown if any ingredient has them; missing ones count as 0.
 */
export function blendDietNutrition(diet: DietInput, foods: RawFood[]): NutritionDetail | null {
    const parts = ingredientMasses(diet, foods);
    const totalMass = sumOf(parts.map(part => part.mass));

    if (totalMass <= 0) return null;

    const blend = (value: (food: RawFood) => number | null | undefined): number | null => {
        if (parts.every(part => value(part.food) == null)) return null;

        return sumOf(parts.map(part => (part.mass / totalMass) * (value(part.food) ?? 0)));
    };

    const micronutrients: Micronutrients = {};

    for (const key of MICRONUTRIENT_KEYS) {
        const amount = blend(food => food.micronutrients?.[key]);

        if (amount != null) micronutrients[key] = amount;
    }

    const aminoAcids: AminoAcids = {};

    for (const key of AMINO_ACID_KEYS) {
        const amount = blend(food => food.amino_acids?.[key]);

        if (amount != null) aminoAcids[key] = amount;
    }

    return {
        calories:     blend(food => food.calories) ?? 0,
        fat:          blend(food => food.fat) ?? 0,
        saturatedFat: blend(food => food.sat_fat) ?? 0,
        transFat:     blend(food => food.trans_fat),
        cholesterol:  blend(food => food.cholesterol),
        sodium:       blend(food => food.sodium),
        carbs:        blend(food => food.carbs),
        fiber:        blend(food => food.fiber) ?? 0,
        sugar:        blend(food => food.sugar),
        protein:      blend(food => food.protein) ?? 0,
        micronutrients: Object.keys(micronutrients).length > 0 ? micronutrients : null,
        aminoAcids:     Object.keys(aminoAcids).length > 0 ? aminoAcids : null,
    };
}

export function toIntelligenceDetail(food: RawFood): IntelligenceDetail {
    return {
        neuronCount:   food.neuron_count ?? 0,
        weightKg:      food.weight_kg,
        yieldFraction: food.yield_fraction,
    };
}

/**
 * Physical land (m² per kg) of a diet diet: each ingredient's land weighted by its share of the diet's mass.
 * The scorer leaves a diet's own land detail empty, so it is rebuilt here from the ingredients.
 * Calorie shares become mass by dividing by calories per gram, as in the scorer; null when nothing matches.
 */
export function blendLandM2PerKg(
    diet: DietInput, foods: RawFood[], rawM2PerKg: (slug: string) => number | null | undefined,
): number | null {
    const parts = ingredientMasses(diet, foods).flatMap(({ food, mass }) => {
        const land = rawM2PerKg(food.slug);

        return land != null ? [{ mass, land }] : [];
    });

    const totalMass = sumOf(parts.map(part => part.mass));

    return totalMass > 0 ? sumOf(parts.map(part => (part.mass / totalMass) * part.land)) : null;
}
