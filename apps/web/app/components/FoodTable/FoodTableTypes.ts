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
    micronutrients: Micronutrients | null;
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
    intelligencePerDeath:    number;  // intelligence score of one death of this animal
    lifespanYears:           number;  // species lifespan used in that score
};

// How the Improvement score was built (matches Rust ImprovementDetail).
export type ImprovementTerm = {
    measure:    'nutrition' | 'emissions' | 'landUse' | 'water' | 'sentientHarm' | 'availability';
    ratio:      number;   // > 1 beats the reference
    priority:   number;   // priority slider share (0–100)
    zeroCapped: boolean;  // scored 0 here, so got the batch's best ratio × zero-better multiplier
};

export type ImprovementDetail = {
    terms:       ImprovementTerm[];
    exponent:    number;  // power-mean exponent: 1 average, 0 geometric, -1 harmonic
    mean:        number;  // before the wild penalty
    wildPenalty: number;  // Over-Hunting / Over-Gathering divisor (1 = none)
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

import type { SortKey } from './FoodTableSort';
import type { MealIngredient } from './MealBuilder';

// ── Food data (rows returned by the API) ──────────────────────────────────────

export type RawFood = {
  name: string; slug: string; type: 'plant' | 'animal';
  calories: number; fat: number; protein: number; fiber: number; sat_fat: number;
  sodium: number | null; carbs: number | null; sugar: number | null;
  cholesterol: number | null; trans_fat: number | null;
  // vitamins and minerals per gram (units in data/json/SCHEMA.md); null when none are sourced
  micronutrients: Micronutrients | null;
  yield_kg_ha: number | null; pasture_ha_per_kg_output: number | null;
  emissions_per_kg: number | null; water_per_kg: number | null;
  neuron_count: number; weight_kg: number | null; yield_fraction: number | null;
  lifetime_output_kg: number | null;
  // offspring killed per producing animal (dairy calves, culled male chicks)
  offspring_deaths_per_animal: number | null;
  offspring_captivity_years:   number | null;
  ch4_kg_per_kg_output: number | null;
  n2o_kg_per_kg_output: number | null;
  co2_kg_per_kg_output: number | null;
  green_water_per_kg: number | null;
  blue_water_per_kg:  number | null;
  grey_water_per_kg:  number | null;
  pesticide_insect_paf:      number | null;
  pesticide_terrestrial_paf: number | null;
  pesticide_bee_hazard:      number | null;
  pesticide_kg_per_kg_food:  number | null;
  feed_water_per_kg: number | null;
  feed_emissions_per_kg: number | null;
  feed_green_water_per_kg: number | null;
  feed_blue_water_per_kg:  number | null;
  feed_grey_water_per_kg:  number | null;
  feed_pesticide_insect_paf:      number | null;
  feed_pesticide_terrestrial_paf: number | null;
  feed_pesticide_bee_hazard:      number | null;
  feed_pesticide_kg_per_kg_food:  number | null;
  feed_land_m2_per_kg:            number | null;
  // bycatch — kg of bycatch animal killed per kg of this food; null if no bycatch
  bycatch_amount:       number | null;
  bycatch_food_slug:    string | null;
  bycatch_neuron_count: number | null;
  bycatch_weight_kg:    number | null;
  // wild fish killed for fishmeal / fish oil — per kg of product, or summed over an animal's feed
  wild_fish_kg_per_kg:      number | null;
  wild_fish_neuron_count:   number | null;
  wild_fish_weight_kg:      number | null;
  wild_fish_lifespan_years: number | null;
  // global supply availability
  availability_gg: number | null;
  // plain-English tooltip text for the sentient harm columns
  sentient_harm_explanation: string | null;
  // fraction of this food's land in each land type (sums to 1); null for foods with no farmland
  land_types: LandTypes | null;
  // food group from the source JSON file (e.g. 'nuts', 'leafy'); drives the table filter buttons
  category: string | null;
  tags: string[];
};

export const MICRONUTRIENT_KEYS = [
  'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'folate', 'vitamin_b12', 'vitamin_b6',
  'calcium', 'iron', 'magnesium', 'potassium', 'zinc', 'phosphorus', 'selenium', 'ala', 'epa_dha',
] as const;

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number];

// Only the nutrients the source reports are present. Keys match the Rust Micronutrients struct.
export type Micronutrients = Partial<Record<MicronutrientKey, number>>;

// One value per broad land type — a food's land split (fractions) or the Land Use
// slider weights (multipliers). Keys match the Rust LandTypes struct.
export type LandTypes = {
  tropical_forest:     number;
  tropical_savanna:    number;
  temperate_grassland: number;
  temperate_forest:    number;
  dry:                 number;
  wetland:             number;
};

// Nutrition sliders: points each nutrient adds to (or takes from) the Nutrition score.
// Matches the Rust NutritionWeights.
export type NutritionWeights = {
  protein:        number;  // per g (helps)
  fiber:          number;  // per g (helps)
  micronutrients: number;  // per full daily value of a vitamin/mineral (helps)
  satFat:         number;  // per g (harms)
  freeSugar:      number;  // per g of sugar beyond the fiber allowance (harms)
  sugarAllowance: number;  // g of sugar per g of fiber not counted as free sugar
  sodium:         number;  // per 100 mg (harms)
};

// ── Inputs (columns, data region, sliders) ────────────────────────────────────

export type ColConfig = { key: SortKey; label: string; defaultVisible: boolean; mobileVisible: boolean };

export type DataRegion = 'world' | 'us' | 'avg';

export type SliderValues = {
    weights:                    FoodWeights;
    scorePriorities:            ScorePriorities;
    greenWaterWeight:           number;
    greyWaterWeight:            number;
    killMultiplier:             number;
    captivityMultiplier:        number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
    zeroBetterMultiplier:       number;
    landTypeWeights:            LandTypes;
    nutritionWeights:           NutritionWeights;
    winDampening:               number;
    overHuntingFactor:          number;
    overGatheringFactor:        number;
    referenceSlug:              string;
    mealIngredients:            MealIngredient[];
};

// Minimal RawFood stub for the synthetic "your-meal" row, which is produced by
// WASM but never exists in rawFoods from the API.
export const MEAL_STUB: RawFood = {
    name: 'Your Meal', slug: 'your-meal', type: 'plant',
    calories: 0, fat: 0, protein: 0, fiber: 0, sat_fat: 0, neuron_count: 0,
    sodium: null, carbs: null, sugar: null, cholesterol: null, trans_fat: null, micronutrients: null,
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
};

export const EMPTY_SENTIENT_HARM_DETAIL: SentientHarmDetail = {
    directKillScore: 0,
    insectScore: 0, beeScore: 0, wormScore: 0, deforestationScore: 0,
    feedInsectScore: 0, feedBeeScore: 0, feedWormScore: 0,
    feedDeforestationScore: 0, pastureDeforestationScore: 0, bycatchScore: 0,
    captiveSentienceScore: 0,
};
