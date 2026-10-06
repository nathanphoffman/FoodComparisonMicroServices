import type { ColConfig, DataRegion, FoodWeights, LandTypes, NutritionWeights, ScorePriorities, SliderValues } from './FoodTableTypes';
import { DEFAULT_LEVEL, toShares } from './Sliders/PercentSliders';

// ── Column config ─────────────────────────────────────────────────────────────

export const COLUMN_CONFIG: ColConfig[] = [
    { key: 'name',             label: 'Food',                   defaultVisible: true,  mobileVisible: true  },
    { key: 'rank',             label: 'Rank',                   defaultVisible: false, mobileVisible: false },
    { key: 'nutritionScore',   label: 'Nutrition Score',        defaultVisible: true,  mobileVisible: true  },
    { key: 'emissions',        label: 'CO₂e (kg / kg)',         defaultVisible: true,  mobileVisible: false },
    { key: 'landUse',          label: 'Land Use (m² / kg)',     defaultVisible: true,  mobileVisible: false },
    { key: 'directKill',       label: 'Direct Kill',            defaultVisible: true,  mobileVisible: false },
    { key: 'water',            label: 'Water (L / kg)',         defaultVisible: true,  mobileVisible: false },
    { key: 'captiveSentience', label: 'Captive Sentience Cost', defaultVisible: true,  mobileVisible: false },
    { key: 'sentientHarm',     label: 'Sentient Harm',          defaultVisible: true,  mobileVisible: false },
    { key: 'availability',     label: 'Availability (Gg)',      defaultVisible: true,  mobileVisible: false },
    { key: 'finalScore',       label: 'Improvement',            defaultVisible: true,  mobileVisible: true  },
];

// ── Data region ───────────────────────────────────────────────────────────────

export const DEFAULT_DATA_REGION: DataRegion = 'avg';

export const DATA_REGION_OPTIONS: { value: DataRegion; label: string }[] = [
    { value: 'world', label: 'World' },
    { value: 'us',    label: 'US' },
    { value: 'avg',   label: 'Average of World + US' },
];

// ── Slider defaults ───────────────────────────────────────────────────────────
// Every slider's starting value lives here. Some must match the Rust defaults in
// the SliderQuery (services/wasm-calculations) — those are marked.

// Levels out of 10; shares come out to 50% calories, 20% protein, 20% dry mass, 10% wet mass.
export const DEFAULT_FOOD_WEIGHT_LEVELS: FoodWeights = { calories: 5, protein: 2, dryMass: 2, wetMass: 1 };
export const DEFAULT_FOOD_WEIGHTS: FoodWeights = toShares(DEFAULT_FOOD_WEIGHT_LEVELS);

// Equal weight for all six.
export const DEFAULT_SCORE_PRIORITY_LEVELS: ScorePriorities = {
    nutrition:    DEFAULT_LEVEL,
    emissions:    DEFAULT_LEVEL,
    intelligence: DEFAULT_LEVEL,
    water:        DEFAULT_LEVEL,
    landUse:      DEFAULT_LEVEL,
    availability: DEFAULT_LEVEL,
};
export const DEFAULT_SCORE_PRIORITIES: ScorePriorities = toShares(DEFAULT_SCORE_PRIORITY_LEVELS);

export const DEFAULT_GREEN_WATER                 = 25;
export const DEFAULT_GREY_WATER                  = 25;
export const DEFAULT_PHILOSOPHICAL_KILL          = 500;
export const DEFAULT_CAPTIVITY_MULTIPLIER        = 1;
export const DEFAULT_NEURON_EXPONENT             = 1.5;
export const DEFAULT_WEIGHT_EXPONENT             = 0.75;
export const DEFAULT_FINAL_INTELLIGENCE_EXPONENT = 1.15;
export const DEFAULT_ZERO_BETTER_MULTIPLIER      = 1.5;

// 1 = geometric mean (the original behavior). Keep in sync with default_win_dampening() in Rust.
export const DEFAULT_WIN_DAMPENING = 1;
// Keep in sync with default_over_hunting_factor() in Rust.
export const DEFAULT_OVER_HUNTING = 2.5;
// Keep in sync with default_over_gathering_factor() in Rust.
export const DEFAULT_OVER_GATHERING = 1.5;

// 1.0 = neutral. Keep in sync with default_land_type_weights() in the Rust SliderQuery.
// From Chaudhary & Brooks (2018) global land occupation biodiversity factors (UNEP-SETAC
// recommended; potential species loss per m², all five taxa): for each land type, the
// median and geometric mean over its biome's ecoregions, averaged, relative to temperate
// forest = 1. Cropland and pasture give the same ratios.
export const DEFAULT_LAND_TYPE_WEIGHTS: LandTypes = {
    tropical_forest:     10.0,  // Olson biomes 1–3 (tropical moist, dry and coniferous forest)
    wetland:             1.8,   // biomes 9 and 14 (flooded grassland, mangroves)
    tropical_savanna:    1.2,   // biome 7
    temperate_forest:    1.0,   // biomes 4–5
    dry:                 0.85,  // biomes 12–13 (Mediterranean, desert and xeric)
    temperate_grassland: 0.45,  // biome 8
};

// Keep in sync with NutritionWeights::default() in Rust (nutrition_weights.rs).
export const DEFAULT_NUTRITION_WEIGHTS: NutritionWeights = {
    protein:        1,
    fiber:          2,
    micronutrients: 2,
    satFat:         2,
    freeSugar:      0.25,
    sugarAllowance: 5,
    sodium:         2,
};

// ── Slider values ─────────────────────────────────────────────────────────────

export const DEFAULT_SLIDER_VALUES: SliderValues = {
    weights:                    DEFAULT_FOOD_WEIGHTS,
    scorePriorities:            DEFAULT_SCORE_PRIORITIES,
    greenWaterWeight:           DEFAULT_GREEN_WATER,
    greyWaterWeight:            DEFAULT_GREY_WATER,
    killMultiplier:             DEFAULT_PHILOSOPHICAL_KILL,
    captivityMultiplier:        DEFAULT_CAPTIVITY_MULTIPLIER,
    neuronExponent:             DEFAULT_NEURON_EXPONENT,
    weightExponent:             DEFAULT_WEIGHT_EXPONENT,
    finalIntelligenceExponent:  DEFAULT_FINAL_INTELLIGENCE_EXPONENT,
    zeroBetterMultiplier:       DEFAULT_ZERO_BETTER_MULTIPLIER,
    landTypeWeights:            DEFAULT_LAND_TYPE_WEIGHTS,
    nutritionWeights:           DEFAULT_NUTRITION_WEIGHTS,
    winDampening:               DEFAULT_WIN_DAMPENING,
    overHuntingFactor:          DEFAULT_OVER_HUNTING,
    overGatheringFactor:        DEFAULT_OVER_GATHERING,
    referenceSlug:              'chicken',
};
