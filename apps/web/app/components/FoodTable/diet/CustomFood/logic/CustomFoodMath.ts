import type { CustomFoodInput, Micronutrients, MicronutrientKey } from '../../../types/FoodTableTypes';
import { absorptionMultiplier, absorbedFromDose, mealsPerDayFor, ABSORPTION_NUTRIENTS } from '../../../nutrition/FoodTableAbsorption';
import type { DietSettings } from '../../../nutrition/FoodTableRda';
import { DAYS_PER_WEEK, FINE_MAX_PERCENT, toPercents, type Ingredient, type Saved } from './CustomFoodSaved';

export type BuilderFood = { slug: string; name: string; calories?: number; micronutrients?: Micronutrients | null };

/** What the table scores: each ingredient as a fraction of the food. */
export function toInput(slug: string, name: string, { basis, ingredients }: Saved): CustomFoodInput {
    return {
        slug, name, basis,
        ingredients: toPercents(ingredients).map((percent, i) => ({ slug: ingredients[i].slug, fraction: percent / 100 })),
    };
}

/**
 * Each ingredient's weight toward the day's calories. By calories that's its percentage; by mass it's
 * its grams times its calories per gram. Divide by the sum to get its share of the day.
 */
function calorieWeights(state: Saved, foods: BuilderFood[]): number[] {
    const shares = toPercents(state.ingredients);
    return state.ingredients.map((ing, i) => state.basis === 'calories' ? shares[i] : shares[i] * (foods.find(f => f.slug === ing.slug)?.calories ?? 0));
}

/** One ingredient's calories per day; null until a daily total is set or if the ingredient isn't in the diet. */
export function caloriesPerDayIn(state: Saved, foods: BuilderFood[], ingredientSlug: string): number | null {
    const index = state.ingredients.findIndex(i => i.slug === ingredientSlug);
    if (!state.calorieTarget || index < 0) return null;
    const weights = calorieWeights(state, foods);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return total > 0 ? (weights[index] / total) * state.calorieTarget : null;
}

/** The ingredient's level that makes its share exactly `percent`, given the other ingredients' levels. */
export function levelForPercent(ingredients: Ingredient[], index: number, percent: number): number {
    const others = ingredients.reduce((sum, ing, j) => j === index ? sum : sum + ing.level, 0);
    return others > 0 ? (percent / (100 - percent)) * others : ingredients[index].level;
}

/** Level for an ingredient switched to fine control: kept as is unless its share is already above the fine slider's top. */
export function levelForFine(ingredients: Ingredient[], index: number): number {
    const percent = toPercents(ingredients)[index];
    return percent > FINE_MAX_PERCENT ? levelForPercent(ingredients, index, FINE_MAX_PERCENT) : ingredients[index].level;
}

/** The daily settings the nutrition tooltips use, including how much of each absorption-limited nutrient still counts. */
export function settingsOf(state: Saved, foods: BuilderFood[]): DietSettings {
    // Each pill is one sitting, so its absorbed amount is capped for B12, calcium and vitamin C; spread over the week.
    const supplements: Partial<Record<MicronutrientKey, number>> = {};
    for (const { key, dose, perWeek } of state.supplements) {
        supplements[key] = (supplements[key] ?? 0) + absorbedFromDose(key, dose) * (state.pillAbsorption / 100) * perWeek / DAYS_PER_WEEK;
    }
    const base = { calories: state.calorieTarget, sex: state.sex, age: state.age, weightLb: state.weightLb, activity: state.activity, supplements };
    if (!state.calorieTarget) return base;
    const weights = calorieWeights(state, foods);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return base;
    // The share of each absorption-limited nutrient that still counts, from each food's daily amount and meals per day.
    const all: Partial<Record<MicronutrientKey, number>> = {};
    const counted: Partial<Record<MicronutrientKey, number>> = {};
    state.ingredients.forEach((ing, i) => {
        const food = foods.find(f => f.slug === ing.slug);
        if (!food?.calories || !food.micronutrients) return;
        const grams = (weights[i] / total) * state.calorieTarget! / food.calories;
        for (const key of ABSORPTION_NUTRIENTS) {
            const daily = (food.micronutrients[key] ?? 0) * grams;
            all[key] = (all[key] ?? 0) + daily;
            counted[key] = (counted[key] ?? 0) + daily * absorptionMultiplier(key, daily, mealsPerDayFor(state.daysBetween));
        }
    });
    const absorption: Partial<Record<MicronutrientKey, number>> = {};
    for (const key of ABSORPTION_NUTRIENTS) if ((all[key] ?? 0) > 0) absorption[key] = counted[key]! / all[key]!;
    return { ...base, absorption };
}
