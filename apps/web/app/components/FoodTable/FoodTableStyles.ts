import { ONE_TRILLION } from './FoodTableCalculations';

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

const GOOD_IMPROVEMENT_THRESHOLD = 1.5;
const FAIR_IMPROVEMENT_THRESHOLD = 0.7;

// ── Tones ─────────────────────────────────────────────────────────────────────
// How good or bad a value is. The table's text/badge colours and the food detail
// modal's tiles both come from these, so the thresholds live in one place.

export type Tone = 'good' | 'fair' | 'poor' | 'bad' | 'worst';

export function getEmissionsTone(value: number): Tone {
  if (value < LOW_EMISSIONS_THRESHOLD)  return 'good';
  if (value < HIGH_EMISSIONS_THRESHOLD) return 'fair';
  return 'bad';
}

export function getWaterTone(value: number): Tone {
  if (value < LOW_WATER_USE_THRESHOLD)  return 'good';
  if (value < HIGH_WATER_USE_THRESHOLD) return 'fair';
  return 'bad';
}

export function getNutritionScoreTone(score: number): Tone {
  if (score > GOOD_NUTRITION_SCORE_THRESHOLD) return 'good';
  if (score > FAIR_NUTRITION_SCORE_THRESHOLD) return 'fair';
  return 'bad';
}

export function getLandUseTone(value: number): Tone {
  if (value < LOW_LAND_USE_THRESHOLD)  return 'good';
  if (value < HIGH_LAND_USE_THRESHOLD) return 'fair';
  return 'bad';
}

/** Direct kill. Zero (no animal killed) is 'good'; callers handle that case. */
export function getIntelligenceTone(value: number): Tone {
  if (value <= 0)            return 'good';
  if (value >= TEN_TRILLION) return 'bad';
  if (value >= ONE_TRILLION) return 'poor';
  return 'fair';
}

export function getImprovementTone(ratio: number): Tone {
  if (ratio >= GOOD_IMPROVEMENT_THRESHOLD) return 'good';
  if (ratio >= FAIR_IMPROVEMENT_THRESHOLD) return 'fair';
  return 'bad';
}

/** Sentient harm and captive sentience. Zero is 'good'. */
export function getSentientHarmTone(value: number): Tone {
  if (value <= 0)                    return 'good';
  if (value >= ONE_HUNDRED_TRILLION) return 'worst';
  if (value >= TEN_TRILLION)         return 'bad';
  if (value >= ONE_TRILLION)         return 'poor';
  return 'fair';
}

// ── Table colours ─────────────────────────────────────────────────────────────

const BADGE_COLORS: Record<Tone, string> = {
  good:  'bg-green-100 text-green-700',
  fair:  'bg-yellow-100 text-yellow-700',
  poor:  'bg-orange-100 text-orange-700',
  bad:   'bg-red-100 text-red-700',
  worst: 'bg-red-100 text-red-800',
};

const WATER_COLORS: Record<Tone, string> = {
  good: 'text-sky-600', fair: 'text-amber-600', poor: 'text-orange-600', bad: 'text-red-600', worst: 'text-red-700',
};

const LAND_USE_COLORS: Record<Tone, string> = {
  good: 'text-green-600', fair: 'text-amber-600', poor: 'text-orange-600', bad: 'text-red-600', worst: 'text-red-700',
};

const HARM_COLORS: Record<Tone, string> = {
  good:  'text-green-600 font-medium',
  fair:  'text-amber-600 font-medium',
  poor:  'text-orange-600 font-medium',
  bad:   'text-red-600 font-medium',
  worst: 'text-red-700 font-medium',
};

export function getEmissionsColor(value: number): string {
  return BADGE_COLORS[getEmissionsTone(value)];
}

export function getWaterColor(value: number): string {
  return WATER_COLORS[getWaterTone(value)];
}

export function getNutritionScoreColor(score: number): string {
  return BADGE_COLORS[getNutritionScoreTone(score)];
}

export function getLandUseColor(value: number): string {
  return LAND_USE_COLORS[getLandUseTone(value)];
}

export function getIntelligenceColor(value: number): string {
  return HARM_COLORS[getIntelligenceTone(value)];
}

export function getImprovementColor(ratio: number): string {
  return BADGE_COLORS[getImprovementTone(ratio)];
}

export function getSentientHarmColor(value: number): string {
  return HARM_COLORS[getSentientHarmTone(value)];
}

// ── Food detail modal tiles ───────────────────────────────────────────────────

/** Tile background, border and text for each tone; 'neutral' has no good/bad scale. */
export const TILE_COLORS: Record<Tone | 'neutral', string> = {
  good:    'bg-green-50 border-green-200 text-green-800',
  fair:    'bg-yellow-50 border-yellow-200 text-yellow-800',
  poor:    'bg-orange-50 border-orange-200 text-orange-800',
  bad:     'bg-red-50 border-red-200 text-red-800',
  worst:   'bg-red-100 border-red-300 text-red-900',
  neutral: 'bg-neutral-50 border-neutral-200 text-neutral-800',
};
