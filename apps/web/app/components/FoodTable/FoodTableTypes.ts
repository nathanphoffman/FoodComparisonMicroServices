export type FoodWeights = {
    calories: number;
    protein:  number;
    dryMass:  number;
    wetMass:  number;
};

// How much each measure counts toward the Improvement score (sums to 100).
export type ScorePriorities = {
    nutrition:    number;
    emissions:    number;
    intelligence: number;
    water:        number;
    landUse:      number;
    availability: number;
};

export type EmissionsBreakdown = {
    co2:           number;
    ch4:           number;
    n2o:           number;
    feedEmissions?: number;
};

export type WaterDetail = {
    green: number | null;
    blue:  number | null;
    grey:  number | null;
};

export type LandUseDetail = {
    type:                        'plant' | 'animal';
    yieldKilogramsPerHectare:    number | null;
    pastureHectaresPerKilogram:  number | null;
    feedLandM2PerKg:             number | null;
    rawM2PerKg:                  number;            // area before the land type multiplier
    landTypes:                   LandTypes | null;  // this food's land split
    multiplier:                  number;            // weighted average of the Land Use sliders (1 = neutral)
};

export type NutritionDetail = {
    calories:     number;
    fat:          number;
    saturatedFat: number;
    transFat:     number | null;
    cholesterol:  number | null;
    sodium:       number | null;
    carbs:        number | null;
    fiber:        number;
    sugar:        number | null;
    protein:      number;
};

export type IntelligenceDetail = {
    neuronCount:   number;
    weightKg:      number | null;
    yieldFraction: number | null;
};

// Per-animal facts behind direct kill and captivity (matches Rust KillDetail).
export type KillDetail = {
    outputKgPerDeath:        number;
    offspringDeaths:         number;
    captivityYears:          number;
    offspringCaptivityYears: number;
};

export type SentientHarmDetail = {
    directKillScore:           number;
    insectScore:               number;
    beeScore:                  number;
    wormScore:                 number;
    deforestationScore:        number;
    feedInsectScore:           number;
    feedBeeScore:              number;
    feedWormScore:             number;
    feedDeforestationScore:    number;
    pastureDeforestationScore: number;
    bycatchScore:              number;
    captiveSentienceScore:     number;
};

import type { RawFood, LandTypes } from '@/lib/queries/commonFoods';

// Minimal RawFood stub for the synthetic "your-meal" row, which is produced by
// WASM but never exists in rawFoods from the API.
export const MEAL_STUB: RawFood = {
    name: 'Your Meal', slug: 'your-meal', type: 'plant',
    calories: 0, fat: 0, protein: 0, fiber: 0, sat_fat: 0, neuron_count: 0,
    sodium: null, carbs: null, sugar: null, cholesterol: null, trans_fat: null,
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
    availability_gg: null, sentient_harm_explanation: null, land_types: null,
    category: null, tags: [],
};

export const EMPTY_SENTIENT_HARM_DETAIL: SentientHarmDetail = {
    directKillScore: 0,
    insectScore: 0, beeScore: 0, wormScore: 0, deforestationScore: 0,
    feedInsectScore: 0, feedBeeScore: 0, feedWormScore: 0,
    feedDeforestationScore: 0, pastureDeforestationScore: 0, bycatchScore: 0,
    captiveSentienceScore: 0,
};
