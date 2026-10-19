import type { SliderScale, ValueSliderSettings } from "./ValueSlider";

// Settings for every single-value slider. Starting values live in FoodTableDefaults.

const percent    = (value: number) => `${value}%`;
const times      = (value: number) => `${value}×`;
const times1dp   = (value: number) => `${value.toFixed(1)}×`;
const twoDecimal = (value: number) => value.toFixed(2);

// ── Water ─────────────────────────────────────────────────────────────────────

export const GREY_WATER: ValueSliderSettings = {
    label:       'Pollution Water',
    description: 'how much grey (pollution) water counts',
    min: 0, max: 100,
    format: percent,
    helpTopic:  'greyWater',
};

export const GREEN_WATER: ValueSliderSettings = {
    label:       'Rain Water',
    description: 'how much green (rain) water counts',
    min: 0, max: 100,
    format:  percent,
    helpTopic:   'greenWater',
    divider: true,
};

// ── Intelligence ──────────────────────────────────────────────────────────────

export const NEURON_EXPONENT: ValueSliderSettings = {
    label:       'Neuron Exponent',
    description: 'exponent applied to neuron count in intelligence calc',
    min: 1, max: 2, step: 0.05,
    format: twoDecimal,
    helpTopic:  'neuronExponent',
};

export const WEIGHT_EXPONENT: ValueSliderSettings = {
    label:       'Weight Exponent',
    description: 'exponent applied to body mass in intelligence calc',
    min: 0.1, max: 2, step: 0.05,
    format: twoDecimal,
    helpTopic:  'weightExponent',
};

export const FINAL_INTELLIGENCE_EXPONENT: ValueSliderSettings = {
    label:       'Emergent Intelligence',
    description: 'final nonlinear curve applied to overall intelligence score',
    min: 1.0, max: 1.5, step: 0.01,
    format: twoDecimal,
    helpTopic:  'finalIntelligenceExponent',
};

export const MAX_PHILOSOPHICAL_KILL = 1000;

export const PHILOSOPHICAL_KILL: ValueSliderSettings = {
    label:       'Kill : Accident',
    description: 'how much worse intentional killing is vs. accidental',
    min: 0, max: MAX_PHILOSOPHICAL_KILL,
    format:  times,
    helpTopic:   'philosophicalKill',
    divider: true,
};

// Log scale: slider position 0–300 maps to 0.01×–10×.
const MIN_LOG = -2;
const POSITIONS_PER_DECADE = 100;
const MAX_CAPTIVITY_POSITION = 300;
const captivityScale: SliderScale = {
    toValue:    (position) => Number(Math.pow(10, position / POSITIONS_PER_DECADE + MIN_LOG).toPrecision(2)),
    toPosition: (value)    => (Math.log10(value) - MIN_LOG) * POSITIONS_PER_DECADE,
};

export const MAX_CAPTIVITY_MULTIPLIER = captivityScale.toValue(MAX_CAPTIVITY_POSITION);

export const CAPTIVITY: ValueSliderSettings = {
    label:       'Years in Captivity to Additional Deaths',
    description: 'how many extra deaths one year in captivity counts as',
    min: 0, max: MAX_CAPTIVITY_POSITION,
    scale:   captivityScale,
    format:  times,
    helpTopic:   'captivity',
    divider: true,
};

// ── Opinionated ───────────────────────────────────────────────────────────────

function describeWinDampening(value: number): string {
    if (value === 0) return 'linear';
    if (value === 1) return 'geometric mean';
    return value < 1 ? 'weaker' : 'stronger';
}

export const WIN_DAMPENING: ValueSliderSettings = {
    label:       'Big-Win Dampening',
    description: 'how much a huge advantage in one measure is shrunk when combining them',
    min: 0, max: 2, step: 0.1,
    format: (value) => `${value.toFixed(1)} (${describeWinDampening(value)})`,
    helpTopic:  'winDampening',
};

export const MAX_OVER_HUNTING = 5;

export const OVER_HUNTING: ValueSliderSettings = {
    label:       'Over-Hunting Factor',
    description: 'divides the Improvement score of wild-caught animals',
    min: 1, max: MAX_OVER_HUNTING, step: 0.5,
    format:  times1dp,
    helpTopic:   'overHunting',
    divider: true,
};

export const OVER_GATHERING: ValueSliderSettings = {
    label:       'Over-Gathering Factor',
    description: 'divides the Improvement score of wild-gathered plants',
    min: 1, max: 5, step: 0.5,
    format:  times1dp,
    helpTopic:   'overGathering',
    divider: true,
};

export const ZERO_BETTER_MULTIPLIER: ValueSliderSettings = {
    label:       'Zero Bonus',
    description: 'how many times better a zero-impact score is vs. the next best',
    min: 1, max: 4, step: 0.1,
    format:  times1dp,
    helpTopic:   'zeroBetterMultiplier',
    divider: true,
};
