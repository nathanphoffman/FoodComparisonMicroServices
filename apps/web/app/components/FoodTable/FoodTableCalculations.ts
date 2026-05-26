import type { RawFood } from '@/lib/queries/commonFoods';
import type { EcoDestructionDetail, EmissionsBreakdown, FoodEthics, FoodWeights, WaterDetail } from './FoodTableTypes';

const ONE_THOUSAND = 1_000;
export const ONE_MILLION = 1_000_000;
export const ONE_BILLION = 1_000_000_000;
export const ONE_TRILLION = 1e12;
const ONE_QUADRILLION = 1e15;

const NUTRITION_SCORE_CALORIES_BASIS = 100;

export function formatNeurons(neuronCount: number): string {
  if (neuronCount >= ONE_BILLION) return `${(neuronCount / ONE_BILLION).toFixed(0)}B`;
  if (neuronCount >= ONE_MILLION) return `${(neuronCount / ONE_MILLION).toFixed(0)}M`;
  if (neuronCount >= ONE_THOUSAND) return `${(neuronCount / ONE_THOUSAND).toFixed(0)}K`;
  return String(neuronCount);
}

export function formatIntelligenceValue(value: number): string {
  if (value >= ONE_QUADRILLION) return `${(value / ONE_QUADRILLION).toFixed(1)}P`;
  if (value >= ONE_TRILLION) return `${(value / ONE_TRILLION).toFixed(1)}T`;
  if (value >= ONE_BILLION) return `${(value / ONE_BILLION).toFixed(1)}G`;
  if (value >= ONE_MILLION) return `${(value / ONE_MILLION).toFixed(1)}M`;
  return value.toFixed(0);
}

export function nutritionScale(calories: number): number {
  return calories > 0 ? NUTRITION_SCORE_CALORIES_BASIS / calories : 0;
}

const SQUARE_METERS_PER_HECTARE = 10000;
const NEURAL_INTERCONNECTIVITY_EXPONENT = 1.5;
const NUTRITION_SCORE_SCALE = 100;
const FIBER_SCORE_WEIGHT = 2;
const SATURATED_FAT_SCORE_PENALTY = 2;

// ─── Intelligence lifespan constants (guesstimate natural lifespans, years) ──

const LIFESPAN_YEARS_BY_SLUG: Record<string, number> = {
  beef:     20,
  chicken:   8,
  pork:     12,
  turkey:   10,
  lamb:     12,
  milk:     20,
  yogurt:   20,
  egg:       8,
  salmon:    6,
  tuna:     20,
  shrimp:    2,
  sardines:  4,
};
const DEFAULT_LIFESPAN_YEARS = 10;

// ─── Eco Destruction constants ────────────────────────────────────────────────

const INSECT_DENSITY_PER_HA = 1e9;
const INSECT_NEURONS = 1e6;
const INSECT_WEIGHT_KG = 1e-7;    // ~0.1 mg typical arthropod
const INSECT_DEATH_FRACTION = 0.1;

const BEE_DENSITY_PER_HA = 5_000;
const BEE_NEURONS = 960_000;
const BEE_WEIGHT_KG = 1e-4;    // ~100 mg honeybee
const BEE_HAZARD_MORTALITY = 0.5;

const WORM_DENSITY_PER_HA = 500_000;
const WORM_NEURONS = 500;
const WORM_WEIGHT_KG = 3e-3;    // ~3 g earthworm
const WORM_DEATH_FRACTION = 0.3;

const CROPLAND_AGE_YEARS = 50;
const PASTURE_AGE_YEARS = 30;
const MAMMAL_DENSITY_PER_HA = 50;
const MAMMAL_NEURONS = 7e7;
const MAMMAL_WEIGHT_KG = 0.02;    // ~20 g mouse
const BIRD_DENSITY_PER_HA = 10;
const BIRD_NEURONS = 1e8;
const BIRD_WEIGHT_KG = 0.05;    // ~50 g small bird
const REPTILE_DENSITY_PER_HA = 50;
const REPTILE_NEURONS = 5e5;
const REPTILE_WEIGHT_KG = 0.05;    // ~50 g small lizard

const REF_FEED_PESTICIDE_KG_HA = 2.0;

// Guesstimate natural lifespans for eco-destruction organisms (years)
const INSECT_LIFESPAN_YEARS  = 0.17;  // ~2 months, typical arthropod
const BEE_LIFESPAN_YEARS     = 0.08;  // ~4 weeks, worker honeybee
const WORM_LIFESPAN_YEARS    = 5;     // ~5 years, earthworm
const MAMMAL_LIFESPAN_YEARS  = 2.5;   // ~2.5 years, small field mouse
const BIRD_LIFESPAN_YEARS    = 3;     // ~3 years, small songbird
const REPTILE_LIFESPAN_YEARS = 4;     // ~4 years, small lizard

// Per-organism intelligence: neuron^1.5 * lifespan / body_weight_kg
const INSECT_PER_ORG  = Math.pow(INSECT_NEURONS,  NEURAL_INTERCONNECTIVITY_EXPONENT) * INSECT_LIFESPAN_YEARS  / Math.pow(INSECT_WEIGHT_KG,0.75);
const BEE_PER_ORG     = Math.pow(BEE_NEURONS,     NEURAL_INTERCONNECTIVITY_EXPONENT) * BEE_LIFESPAN_YEARS     / BEE_WEIGHT_KG;
const WORM_PER_ORG    = Math.pow(WORM_NEURONS,     NEURAL_INTERCONNECTIVITY_EXPONENT) * WORM_LIFESPAN_YEARS    / WORM_WEIGHT_KG;
const MAMMAL_PER_ORG  = Math.pow(MAMMAL_NEURONS,  NEURAL_INTERCONNECTIVITY_EXPONENT) * MAMMAL_LIFESPAN_YEARS  / MAMMAL_WEIGHT_KG;
const BIRD_PER_ORG    = Math.pow(BIRD_NEURONS,     NEURAL_INTERCONNECTIVITY_EXPONENT) * BIRD_LIFESPAN_YEARS    / BIRD_WEIGHT_KG;
const REPTILE_PER_ORG = Math.pow(REPTILE_NEURONS,  NEURAL_INTERCONNECTIVITY_EXPONENT) * REPTILE_LIFESPAN_YEARS / REPTILE_WEIGHT_KG;

// Combine independent creature-type contributions into one intelligence score.
// Each contrib = N × (neuron^1.5 / weight_kg) for that type.
// Taking ^(2/3) undoes the ^1.5 so types are additive, then ^1.5 re-applies the scaling.
function combineContribs(...contribs: number[]): number {
  const sum = contribs.reduce((acc, c) => acc + (c > 0 ? Math.pow(c, 2 / 3) : 0), 0);
  return Math.pow(sum, 1.5);
}

const EMPTY_ECO_DETAIL: EcoDestructionDetail = {
  insectScore: 0,
  beeScore: 0,
  wormScore: 0,
  deforestationScore: 0,
  feedInsectScore: 0,
  feedBeeScore: 0,
  feedWormScore: 0,
  feedDeforestationScore: 0,
  pastureDeforestationScore: 0,
  bycatchScore: 0,
};

export function computeEcoDestruction(food: RawFood): { score: number | null; detail: EcoDestructionDetail } {
  if (food.type === 'plant') {
    if (food.yield_kg_ha == null || food.yield_kg_ha <= 0) {
      return { score: null, detail: EMPTY_ECO_DETAIL };
    }

    const areaHaPerKg = 1 / food.yield_kg_ha;

    // Deaths per kg food for each creature type
    const insectDeaths = (food.pesticide_insect_paf ?? 0) * INSECT_DENSITY_PER_HA * areaHaPerKg * INSECT_DEATH_FRACTION;
    const beeDeaths = (food.pesticide_bee_hazard ?? 0) * BEE_DENSITY_PER_HA * areaHaPerKg * BEE_HAZARD_MORTALITY;
    const wormDeaths = (food.pesticide_terrestrial_paf ?? 0) * WORM_DENSITY_PER_HA * areaHaPerKg * WORM_DEATH_FRACTION;
    const mammalDeaths = MAMMAL_DENSITY_PER_HA * areaHaPerKg / CROPLAND_AGE_YEARS;
    const birdDeaths = BIRD_DENSITY_PER_HA * areaHaPerKg / CROPLAND_AGE_YEARS;
    const reptileDeaths = REPTILE_DENSITY_PER_HA * areaHaPerKg / CROPLAND_AGE_YEARS;

    // Pre-combination contributions: N × (neuron^1.5 / weight_kg) per type
    const insectScore = insectDeaths * INSECT_PER_ORG;
    const beeScore = beeDeaths * BEE_PER_ORG;
    const wormScore = wormDeaths * WORM_PER_ORG;
    const deforestationScore = mammalDeaths * MAMMAL_PER_ORG
      + birdDeaths * BIRD_PER_ORG
      + reptileDeaths * REPTILE_PER_ORG;

    const total = combineContribs(
      insectScore, beeScore, wormScore,
      mammalDeaths * MAMMAL_PER_ORG, birdDeaths * BIRD_PER_ORG, reptileDeaths * REPTILE_PER_ORG,
    );
    return {
      score: total > 0 ? total : null,
      detail: {
        insectScore,
        beeScore,
        wormScore,
        deforestationScore,
        feedInsectScore: 0,
        feedBeeScore: 0,
        feedWormScore: 0,
        feedDeforestationScore: 0,
        pastureDeforestationScore: 0,
        bycatchScore: 0,
      },
    };
  }

  // animal
  let feedInsectScore = 0;
  let feedBeeScore = 0;
  let feedWormScore = 0;
  let feedDeforestationScore = 0;
  const feedContribs: number[] = [];

  if (food.feed_pesticide_kg_per_kg_food != null && food.feed_pesticide_kg_per_kg_food > 0) {
    const feedArea = food.feed_pesticide_kg_per_kg_food / REF_FEED_PESTICIDE_KG_HA;

    const feedInsectDeaths = (food.feed_pesticide_insect_paf ?? 0) * INSECT_DENSITY_PER_HA * feedArea * INSECT_DEATH_FRACTION;
    const feedBeeDeaths = (food.feed_pesticide_bee_hazard ?? 0) * BEE_DENSITY_PER_HA * feedArea * BEE_HAZARD_MORTALITY;
    const feedWormDeaths = (food.feed_pesticide_terrestrial_paf ?? 0) * WORM_DENSITY_PER_HA * feedArea * WORM_DEATH_FRACTION;
    const feedMammalDeaths = MAMMAL_DENSITY_PER_HA * feedArea / CROPLAND_AGE_YEARS;
    const feedBirdDeaths = BIRD_DENSITY_PER_HA * feedArea / CROPLAND_AGE_YEARS;
    const feedReptileDeaths = REPTILE_DENSITY_PER_HA * feedArea / CROPLAND_AGE_YEARS;

    feedInsectScore = feedInsectDeaths * INSECT_PER_ORG;
    feedBeeScore = feedBeeDeaths * BEE_PER_ORG;
    feedWormScore = feedWormDeaths * WORM_PER_ORG;
    feedDeforestationScore = feedMammalDeaths * MAMMAL_PER_ORG
      + feedBirdDeaths * BIRD_PER_ORG
      + feedReptileDeaths * REPTILE_PER_ORG;

    feedContribs.push(
      feedInsectScore, feedBeeScore, feedWormScore,
      feedMammalDeaths * MAMMAL_PER_ORG, feedBirdDeaths * BIRD_PER_ORG, feedReptileDeaths * REPTILE_PER_ORG,
    );
  }

  let pastureDeforestationScore = 0;
  const pastureContribs: number[] = [];
  if (food.pasture_ha_per_kg_output != null) {
    const pastureMammalDeaths = MAMMAL_DENSITY_PER_HA * food.pasture_ha_per_kg_output / PASTURE_AGE_YEARS;
    const pastureBirdDeaths = BIRD_DENSITY_PER_HA * food.pasture_ha_per_kg_output / PASTURE_AGE_YEARS;
    const pastureReptileDeaths = REPTILE_DENSITY_PER_HA * food.pasture_ha_per_kg_output / PASTURE_AGE_YEARS;
    pastureDeforestationScore = pastureMammalDeaths * MAMMAL_PER_ORG
      + pastureBirdDeaths * BIRD_PER_ORG
      + pastureReptileDeaths * REPTILE_PER_ORG;
    pastureContribs.push(
      pastureMammalDeaths * MAMMAL_PER_ORG,
      pastureBirdDeaths * BIRD_PER_ORG,
      pastureReptileDeaths * REPTILE_PER_ORG,
    );
  }

  // Bycatch — fishing collateral kill: bycatch_amount kg of bycatch animal per kg food.
  // Counted as whole-body kg (discarded, not consumed), so no yield_fraction divisor.
  let bycatchScore = 0;
  const bycatchContribs: number[] = [];
  if (
    food.bycatch_amount != null && food.bycatch_amount > 0 &&
    food.bycatch_neuron_count != null && food.bycatch_neuron_count > 0 &&
    food.bycatch_weight_kg != null && food.bycatch_weight_kg > 0
  ) {
    const bycatchLifespan = LIFESPAN_YEARS_BY_SLUG[food.bycatch_food_slug ?? ''] ?? DEFAULT_LIFESPAN_YEARS;
    const bycatchIndividuals  = food.bycatch_amount / food.bycatch_weight_kg;
    const bycatchNeuronScore  = Math.pow(food.bycatch_neuron_count, NEURAL_INTERCONNECTIVITY_EXPONENT);
    bycatchScore = bycatchIndividuals * bycatchNeuronScore * bycatchLifespan;
    bycatchContribs.push(bycatchScore);
  }

  const total = combineContribs(...feedContribs, ...pastureContribs, ...bycatchContribs);

  if (total === 0) return { score: null, detail: EMPTY_ECO_DETAIL };

  return {
    score: total,
    detail: {
      insectScore: 0,
      beeScore: 0,
      wormScore: 0,
      deforestationScore: 0,
      feedInsectScore,
      feedBeeScore,
      feedWormScore,
      feedDeforestationScore,
      pastureDeforestationScore,
      bycatchScore,
    },
  };
}

// ── Divisor (mirrors Rust compute_divisor + kill_multiplier in calculations/mod.rs) ──────────────
// food.calories and food.protein are per-gram values; ×1000 converts to per-kg,
// then divided by CALORIE_NORM=1000 and PROTEIN_NORM=100 respectively.
export function computeEcoDivisor(food: RawFood, weights: FoodWeights, killMultiplier: number): number {
  const calFactor     = food.calories;      // (calories * 1000) / 1000 = calories
  const proteinFactor = food.protein * 10;  // (protein  * 1000) / 100  = protein * 10
  const d = (weights.mass     / 100) * 1
          + (weights.calories / 100) * calFactor
          + (weights.protein  / 100) * proteinFactor;
  return (d > 0 ? d : 1) * (killMultiplier > 0 ? killMultiplier : 1);
}

export function getUnitLabel(weights: FoodWeights): string {
  if (weights.mass === 100) return 'kg';
  if (weights.calories === 100) return '1000 kcal';
  if (weights.protein === 100) return '100g protein';
  return 'weighted unit';
}

export function mapRawFoodToFoodEthics(food: RawFood): FoodEthics {
  let nutritionScore: number | null = null;
  if (food.calories > 0) {
    const rawScore = food.protein + FIBER_SCORE_WEIGHT * food.fiber - SATURATED_FAT_SCORE_PENALTY * food.sat_fat;
    nutritionScore = (rawScore / food.calories) * NUTRITION_SCORE_SCALE;
  }

  const isPlant = food.type === 'plant';
  const hasPlantYield = food.yield_kg_ha != null && food.yield_kg_ha > 0;
  const hasPasture = food.pasture_ha_per_kg_output != null;

  const pastureLandM2 = hasPasture ? food.pasture_ha_per_kg_output! * SQUARE_METERS_PER_HECTARE : null;
  const feedLandM2   = food.feed_land_m2_per_kg ?? null;
  const landUse = isPlant
    ? (hasPlantYield ? SQUARE_METERS_PER_HECTARE / food.yield_kg_ha! : null)
    : ((pastureLandM2 ?? 0) + (feedLandM2 ?? 0)) || null;

  let intelligence: number | null = null;

  const hasIntelligenceData = food.neuron_count > 0
    && food.weight_kg != null && food.weight_kg > 0
    && food.yield_fraction != null && food.yield_fraction > 0;

  if (hasIntelligenceData) {
    const neuronScore = Math.pow(food.neuron_count, NEURAL_INTERCONNECTIVITY_EXPONENT);
    const edibleMass = food.weight_kg! * food.yield_fraction!;
    const lifespan = LIFESPAN_YEARS_BY_SLUG[food.slug] ?? DEFAULT_LIFESPAN_YEARS;
    intelligence = (neuronScore * lifespan) / edibleMass;
  }

  const GWP_CH4 = 28;
  const GWP_N2O = 265;

  let emissions: number | null = null;
  let emissionsBreakdown: EmissionsBreakdown | undefined = undefined;
  const hasAnimalGasBreakdown = food.type === 'animal' && food.ch4_kg_per_kg_output != null;
  if (hasAnimalGasBreakdown) {
    const co2       = food.co2_kg_per_kg_output as number;
    const ch4Co2e   = (food.ch4_kg_per_kg_output as number) * GWP_CH4;
    const n2oCo2e   = (food.n2o_kg_per_kg_output as number) * GWP_N2O;
    const feedEmissions = food.feed_emissions_per_kg ?? 0;
    emissions = co2 + ch4Co2e + n2oCo2e + feedEmissions;
    emissionsBreakdown = {
      co2,
      ch4: ch4Co2e,
      n2o: n2oCo2e,
      feedEmissions: food.feed_emissions_per_kg ?? undefined,
    };
  } else {
    emissions = food.emissions_per_kg;
  }

  let water: number | null;
  let waterDetail: WaterDetail;
  if (food.type === 'animal') {
    water = food.feed_water_per_kg;
    waterDetail = { green: food.feed_green_water_per_kg, blue: food.feed_blue_water_per_kg, grey: food.feed_grey_water_per_kg };
  } else {
    water = food.water_per_kg;
    waterDetail = { green: food.green_water_per_kg, blue: food.blue_water_per_kg, grey: food.grey_water_per_kg };
  }

  const { score: ecoDestruction, detail: ecoDestructionDetail } = computeEcoDestruction(food);

  return {
    name: food.name,
    slug: food.slug,
    nutritionScore,
    nutritionDetail: {
      calories: food.calories,
      fat: food.fat,
      saturatedFat: food.sat_fat,
      transFat: food.trans_fat,
      cholesterol: food.cholesterol,
      sodium: food.sodium,
      carbs: food.carbs,
      fiber: food.fiber,
      sugar: food.sugar,
      protein: food.protein,
    },
    emissions,
    emissionsBreakdown,
    landUse,
    landUseDetail: {
      type: food.type,
      yieldKilogramsPerHectare: food.yield_kg_ha,
      pastureHectaresPerKilogram: food.pasture_ha_per_kg_output,
      feedLandM2PerKg: food.feed_land_m2_per_kg ?? null,
    },
    intelligence,
    intelligenceDetail: {
      neuronCount: food.neuron_count,
      weightKg: food.weight_kg,
      yieldFraction: food.yield_fraction,
    },
    water,
    waterDetail,
    ecoDestruction,
    ecoDestructionDetail,
  };
}
