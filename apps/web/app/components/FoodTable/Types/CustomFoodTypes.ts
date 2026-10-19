import type { RawFood } from './RawFood';

/** What an ingredient's percentage is a share of. */
export type CustomFoodBasis = 'calories' | 'mass';

export type MealIngredient = { slug: string; fraction: number };

export type CustomFoodInput = {
    slug:        string;
    name:        string;
    basis:       CustomFoodBasis;
    ingredients: MealIngredient[];
};

export const CUSTOM_FOODS = [
    { slug: 'your-diet', name: 'Your Diet', heading: 'Diet',        storageKey: 'food-compare:diet' },
] as const;

export function isCustomFoodSlug(slug: string): boolean {
    return CUSTOM_FOODS.some(custom => custom.slug === slug);
}

// Minimal RawFood stub for a custom food's row.
export const customFoodStub = (slug: string, name: string): RawFood => ({
    name, slug, type: 'plant',
    calories: 0, fat: 0, protein: 0, fiber: 0, sat_fat: 0, neuron_count: 0,
    sodium: null, carbs: null, sugar: null, cholesterol: null, trans_fat: null, micronutrients: null, amino_acids: null,
    yield_kg_ha: null, pasture_ha_per_kg_output: null, emissions_per_kg: null,
    water_per_kg: null, weight_kg: null, yield_fraction: null,
    lifetime_output_kg: null, offspring_deaths_per_animal: null, offspring_captivity_years: null,
    ch4_kg_per_kg_output: null, n2o_kg_per_kg_output: null, co2_kg_per_kg_output: null,
    green_water_per_kg: null, blue_water_per_kg: null, grey_water_per_kg: null,
    pesticide_insect_paf: null, pesticide_terrestrial_paf: null, pesticide_bee_hazard: null,
    pesticide_kg_per_kg_food: null, feed_water_per_kg: null, feed_emissions_per_kg: null,
    feed_green_water_per_kg: null, feed_blue_water_per_kg: null, feed_grey_water_per_kg: null,
    feed_pesticide_insect_paf: null, feed_pesticide_terrestrial_paf: null, feed_pesticide_bee_hazard: null,
    feed_pesticide_kg_per_kg_food: null, feed_land_m2_per_kg: null,
    bycatch_amount: null, bycatch_food_slug: null, bycatch_neuron_count: null, bycatch_weight_kg: null,
    wild_fish_kg_per_kg: null, wild_fish_neuron_count: null, wild_fish_weight_kg: null, wild_fish_lifespan_years: null,
    availability_gg: null, sentient_harm_explanation: null, land_types: null,
    category: null, tags: [],
});
