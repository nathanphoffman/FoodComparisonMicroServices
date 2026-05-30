import { ONE_BILLION, ONE_MILLION, ONE_TRILLION } from './FoodTableCalculations';

const TEN_TRILLION  = 1e13;
const ONE_HUNDRED_TRILLION = 1e14;

const LOW_EMISSIONS_THRESHOLD  = 2;
const HIGH_EMISSIONS_THRESHOLD = 10;

const LOW_WATER_USE_THRESHOLD  = 2_000;
const HIGH_WATER_USE_THRESHOLD = 8_000;

const GOOD_NUTRITION_SCORE_THRESHOLD = 3;
const FAIR_NUTRITION_SCORE_THRESHOLD = 1;

const LOW_LAND_USE_THRESHOLD  = 5;
const HIGH_LAND_USE_THRESHOLD = 50;

export function getEmissionsColor(value: number): string {
  if (value < LOW_EMISSIONS_THRESHOLD)  return 'bg-green-100 text-green-700';
  if (value < HIGH_EMISSIONS_THRESHOLD) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export function getWaterColor(value: number): string {
  if (value < LOW_WATER_USE_THRESHOLD)  return 'text-sky-600';
  if (value < HIGH_WATER_USE_THRESHOLD) return 'text-amber-600';
  return 'text-red-600';
}

export function getNutritionScoreColor(score: number): string {
  if (score > GOOD_NUTRITION_SCORE_THRESHOLD) return 'bg-green-100 text-green-700';
  if (score > FAIR_NUTRITION_SCORE_THRESHOLD) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export function getLandUseColor(value: number): string {
  if (value < LOW_LAND_USE_THRESHOLD)  return 'text-green-600';
  if (value < HIGH_LAND_USE_THRESHOLD) return 'text-amber-600';
  return 'text-red-600';
}

export function getIntelligenceColor(value: number): string {
  if (value >= TEN_TRILLION) return 'text-red-600 font-medium';
  if (value >= ONE_TRILLION) return 'text-orange-600 font-medium';
  return 'text-amber-600 font-medium';
}

export function getNeuronColor(value: number): string {
  if (value >= ONE_BILLION) return 'text-orange-600';
  if (value >= ONE_MILLION) return 'text-amber-600';
  return 'text-yellow-600';
}

const FINAL_SCORE_GOOD_THRESHOLD = 65;
const FINAL_SCORE_FAIR_THRESHOLD = 40;

export function getFinalScoreColor(score: number): string {
    if (score >= FINAL_SCORE_GOOD_THRESHOLD) return 'bg-green-100 text-green-700';
    if (score >= FINAL_SCORE_FAIR_THRESHOLD) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}

export function getSentientHarmColor(value: number): string {
  if (value >= ONE_HUNDRED_TRILLION) return 'text-red-700 font-medium';
  if (value >= TEN_TRILLION)         return 'text-red-600 font-medium';
  if (value >= ONE_TRILLION)         return 'text-orange-600 font-medium';
  return 'text-amber-600 font-medium';
}
