import type { NutrientStandard, Sex } from './FoodTableRda';
import { averageOf } from '@/lib/sumOf';

// Daily reference amounts for protein, fat, carbs, fiber, sugar, sodium and cholesterol, from the US, EFSA, Japan,
// China and WHO. APPROXIMATE: typed from memory, so check them against the official tables.
// 'min' = aim to reach it, 'max' = a limit to stay under, 'range' = aim to land near it (the middle of a recommended range).
export type TargetKey = 'protein' | 'fat' | 'satFat' | 'transFat' | 'cholesterol' | 'sodium' | 'carbs' | 'fiber' | 'sugar';
export type TargetKind = 'min' | 'max' | 'range';
export type Target = { amount: number; kind: TargetKind; unit: 'g' | 'mg' };

const LB_PER_KG = 2.20462;
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARB = 4;
const AVERAGED: Exclude<NutrientStandard, 'average'>[] = ['us', 'eu', 'japan', 'china', 'who'];

// How active you are sets a protein floor in g/kg. Only sports bodies give these, not the national standards
// (EFSA, Japan and China give one value for all adults): the ACSM / Academy of Nutrition and Dietetics / Dietitians of
// Canada position puts athletes at 1.2–2.0 g/kg, ISSN at 1.4–2.0, and the German DGE at 1.2–2.0 for about 5+ hours of
// training a week. The level's value is used when it is above the standard's own g/kg; General uses the standard's, which is for ordinary everyday life.
export const ACTIVITY_LEVELS = [
    { label: 'General',          gPerKg: 0 },
    { label: 'Modest exercise',  gPerKg: 1.0 },
    { label: 'Moderately-heavy exercise', gPerKg: 1.1 },
    { label: 'Heavy exercise',   gPerKg: 1.2 },
    { label: 'Athlete',          gPerKg: 1.6 },
    { label: 'Extreme athlete',  gPerKg: 2.0 },
] as const;
export const DEFAULT_ACTIVITY = 0;

type Pair = [number, number]; // [male, female]
type PerStandard<Amount> = Partial<Record<Exclude<NutrientStandard, 'average'>, Amount>>;

const PROTEIN_G_PER_KG: PerStandard<number> = { us: 0.8, eu: 0.83, japan: 0.9, china: 1.0, who: 0.83 };
const FIBER_G: PerStandard<Pair> = { us: [38, 25], eu: [25, 25], japan: [21, 18], china: [25, 25], who: [25, 25] };
const SODIUM_MG: PerStandard<Pair> = { us: [2300, 2300], eu: [2000, 2000], japan: [2950, 2550], china: [2000, 2000], who: [2000, 2000] };
const CHOLESTEROL_MG: PerStandard<number> = { us: 300, china: 300 };
// Shares of calories (percent).
const FAT_PCT: PerStandard<number> = { us: 27.5, eu: 27.5, japan: 25, china: 25, who: 27.5 };
const SAT_FAT_PCT: PerStandard<number> = { us: 10, japan: 7, china: 10, who: 10 };
const TRANS_FAT_PCT: PerStandard<number> = { who: 1 };
const CARBS_PCT: PerStandard<number> = { us: 55, eu: 52.5, japan: 57.5, china: 57.5, who: 65 };
const FREE_SUGAR_PCT: PerStandard<number> = { us: 10, china: 10, who: 10 };

function pick(value: number | Pair, sex: Sex | null): number {
    if (typeof value === 'number') return value;
    if (sex === null) return (value[0] + value[1]) / 2;
    return value[sex === 'male' ? 0 : 1];
}

function average(standard: NutrientStandard, table: PerStandard<number | Pair>, sex: Sex | null): number | null {
    const values = (standard === 'average' ? AVERAGED : [standard])
        .flatMap(standardName => table[standardName] === undefined ? [] : [pick(table[standardName]!, sex)]);
    return averageOf(values);
}

/** Whole-day reference amounts under a standard. Energy shares need the day's calories. */
export function dailyTargets(
    standard: NutrientStandard, sex: Sex | null, calories: number, weightLb: number | null, activity: number,
): Partial<Record<TargetKey, Target>> {
    const targets: Partial<Record<TargetKey, Target>> = {};
    const add = (key: TargetKey, amount: number | null, kind: TargetKind, unit: 'g' | 'mg') => {
        if (amount !== null) targets[key] = { amount, kind, unit };
    };
    const fromPercent = (percentOfCalories: number | null, caloriesPerGram: number) => percentOfCalories === null ? null : (percentOfCalories / 100) * calories / caloriesPerGram;

    const gPerKg = average(standard, PROTEIN_G_PER_KG, sex);
    const activityGPerKg = ACTIVITY_LEVELS[Math.min(Math.max(Math.round(activity), 0), ACTIVITY_LEVELS.length - 1)].gPerKg;
    add('protein', weightLb && gPerKg !== null ? (weightLb / LB_PER_KG) * Math.max(gPerKg, activityGPerKg) : null, 'min', 'g');
    add('fiber', average(standard, FIBER_G, sex), 'min', 'g');
    add('sodium', average(standard, SODIUM_MG, sex), 'max', 'mg');
    add('cholesterol', average(standard, CHOLESTEROL_MG, sex), 'max', 'mg');
    add('fat', fromPercent(average(standard, FAT_PCT, sex), KCAL_PER_G_FAT), 'range', 'g');
    add('satFat', fromPercent(average(standard, SAT_FAT_PCT, sex), KCAL_PER_G_FAT), 'max', 'g');
    add('transFat', fromPercent(average(standard, TRANS_FAT_PCT, sex), KCAL_PER_G_FAT), 'max', 'g');
    add('carbs', fromPercent(average(standard, CARBS_PCT, sex), KCAL_PER_G_CARB), 'range', 'g');
    add('sugar', fromPercent(average(standard, FREE_SUGAR_PCT, sex), KCAL_PER_G_CARB), 'max', 'g');
    return targets;
}

// ── Tooltip colours ───────────────────────────────────────────────────────────

type Color = 'blue' | 'green' | 'yellow' | 'orange' | 'red';
const COLOR_CLASS: Record<Color, string> = { blue: 'text-blue-300', green: 'text-green-300', yellow: 'text-yellow-300', orange: 'text-orange-300', red: 'text-red-400' };

/**
 * A colour scale for a % of target. `bands` run from the first to the last cutoff and the first one the percent fits wins;
 * anything past the last cutoff gets `beyond`. With `aroundTarget` the cutoffs measure how far the percent is from 100
 * instead (so a range is best near its middle). `exclusive` makes a cutoff count only below it, not at it, except the
 * last one: "over 200%" means blue starts just above 200%, so 200% itself is still the band below.
 */
type ColorScale = { bands: { upTo: number; color: Color }[]; beyond: Color; aroundTarget?: boolean; exclusive?: boolean };

/**
 * Blue very good, green good, yellow neutral, orange sort of bad, red very bad. A limit ('max') is better the further
 * under it; a range is best near its middle; for something to reach ('min') more is better (blue for a lot, which isn't
 * bad, just worth calling out). `nutrient` is the same as 'min' for vitamins and minerals, which go blue sooner.
 */
export const COLOR_SCALES = {
    max: { bands: [{ upTo: 50, color: 'blue' }, { upTo: 100, color: 'green' }, { upTo: 125, color: 'yellow' }, { upTo: 150, color: 'orange' }], beyond: 'red' },
    range: { bands: [{ upTo: 10, color: 'blue' }, { upTo: 25, color: 'green' }, { upTo: 40, color: 'yellow' }, { upTo: 50, color: 'orange' }], beyond: 'red', aroundTarget: true },
    min: { bands: [{ upTo: 50, color: 'red' }, { upTo: 75, color: 'orange' }, { upTo: 125, color: 'yellow' }, { upTo: 250, color: 'green' }], beyond: 'blue', exclusive: true },
    nutrient: { bands: [{ upTo: 50, color: 'red' }, { upTo: 75, color: 'orange' }, { upTo: 125, color: 'yellow' }, { upTo: 200, color: 'green' }], beyond: 'blue', exclusive: true },
} satisfies Record<string, ColorScale>;

/** The text colour class for a % of target on the given scale. */
export function scaleColor(percent: number, scale: ColorScale): string {
    const value = scale.aroundTarget ? Math.abs(percent - 100) : percent;
    const lastIndex = scale.bands.length - 1;
    const band = scale.bands.find((candidate, position) => scale.exclusive && position < lastIndex ? value < candidate.upTo : value <= candidate.upTo);
    return COLOR_CLASS[band?.color ?? scale.beyond];
}

export function targetColor(percent: number, kind: TargetKind): string {
    return scaleColor(percent, COLOR_SCALES[kind]);
}

/** The scale in words for the explainer, e.g. "under 50% is red, 50–75% orange and over 75% blue". */
export function describeScale(scale: ColorScale): string {
    const { bands, beyond, aroundTarget, exclusive } = scale;
    const parts = bands.map((band, position) => {
        if (aroundTarget) return `${100 - band.upTo}–${100 + band.upTo}% ${position === 0 ? 'is ' : ''}${band.color}`;
        return position === 0 ? `${exclusive ? 'under' : 'up to'} ${band.upTo}% is ${band.color}` : `${bands[position - 1].upTo}–${band.upTo}% ${band.color}`;
    });
    parts.push(aroundTarget ? `further out ${beyond}` : `over ${bands[bands.length - 1].upTo}% ${beyond}`);
    return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
