import { ONE_TRILLION } from '../nutrition/FoodTableCalculations';

const TEN_TRILLION = 1e13;
const ONE_HUNDRED_TRILLION = 1e14;

// ── Tones ─────────────────────────────────────────────────────────────────────
// How good or bad a value is. The table's text/badge colours and the food detail
// modal's tiles both come from these, so the thresholds live in one place.

export type Tone = 'good' | 'fair' | 'poor' | 'bad' | 'worst';

type Test = 'below' | 'atMost' | 'above' | 'atLeast';

/** The first rule a value passes sets its tone; a value that passes none gets `otherwise`. */
type ToneScale = { rules: { tone: Tone; test: Test; value: number }[]; otherwise: Tone };

const PASSES: Record<Test, (value: number, limit: number) => boolean> = {
  below:   (value, limit) => value < limit,
  atMost:  (value, limit) => value <= limit,
  above:   (value, limit) => value > limit,
  atLeast: (value, limit) => value >= limit,
};

/** Lower is better: good under `low`, fair under `high`, bad from there. */
const lowerIsBetter = (low: number, high: number): ToneScale => ({
  rules: [{ tone: 'good', test: 'below', value: low }, { tone: 'fair', test: 'below', value: high }],
  otherwise: 'bad',
});

/** Harm scores: zero is good, then fair until each cutoff makes it worse. */
const harmScale = (worseTones: [Tone, number][]): ToneScale => ({
  rules: [{ tone: 'good', test: 'atMost', value: 0 }, ...worseTones.map(([tone, value]) => ({ tone, test: 'atLeast' as const, value }))],
  otherwise: 'fair',
});

const MEASURE_SCALES = {
  emissions: lowerIsBetter(2, 10),
  water: lowerIsBetter(2_000, 8_000),
  landUse: lowerIsBetter(5, 50),
  nutritionScore: { rules: [{ tone: 'good', test: 'above', value: 3 }, { tone: 'fair', test: 'above', value: 1 }], otherwise: 'bad' },
  improvement: { rules: [{ tone: 'good', test: 'atLeast', value: 1.5 }, { tone: 'fair', test: 'atLeast', value: 0.7 }], otherwise: 'bad' },
  // Direct kill. Zero (no animal killed) is 'good'; callers handle that case.
  directKill: harmScale([['bad', TEN_TRILLION], ['poor', ONE_TRILLION]]),
  // Sentient harm and captive sentience.
  sentientHarm: harmScale([['worst', ONE_HUNDRED_TRILLION], ['bad', TEN_TRILLION], ['poor', ONE_TRILLION]]),
} satisfies Record<string, ToneScale>;

export type Measure = keyof typeof MEASURE_SCALES;

export function getTone(measure: Measure, value: number): Tone {
  const { rules, otherwise } = MEASURE_SCALES[measure];

  return rules.find(rule => PASSES[rule.test](value, rule.value))?.tone ?? otherwise;
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

/** Which set of colours each measure's value is drawn in. */
const MEASURE_COLORS: Record<Measure, Record<Tone, string>> = {
  emissions: BADGE_COLORS,
  nutritionScore: BADGE_COLORS,
  improvement: BADGE_COLORS,
  water: WATER_COLORS,
  landUse: LAND_USE_COLORS,
  directKill: HARM_COLORS,
  sentientHarm: HARM_COLORS,
};

export function getColor(measure: Measure, value: number): string {
  return MEASURE_COLORS[measure][getTone(measure, value)];
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
