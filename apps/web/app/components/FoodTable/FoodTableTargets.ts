import type { NutrientStandard, Sex } from './FoodTableRda';

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
type PerStandard<T> = Partial<Record<Exclude<NutrientStandard, 'average'>, T>>;

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

const pick = (value: number | Pair, sex: Sex | null) =>
    typeof value === 'number' ? value : sex === null ? (value[0] + value[1]) / 2 : value[sex === 'male' ? 0 : 1];

function average(standard: NutrientStandard, table: PerStandard<number | Pair>, sex: Sex | null): number | null {
    const values = (standard === 'average' ? AVERAGED : [standard])
        .flatMap(s => table[s] === undefined ? [] : [pick(table[s]!, sex)]);
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

/** Whole-day reference amounts under a standard. Energy shares need the day's calories. */
export function dailyTargets(
    standard: NutrientStandard, sex: Sex | null, calories: number, weightLb: number | null, activity: number,
): Partial<Record<TargetKey, Target>> {
    const targets: Partial<Record<TargetKey, Target>> = {};
    const add = (key: TargetKey, amount: number | null, kind: TargetKind, unit: 'g' | 'mg') => {
        if (amount !== null) targets[key] = { amount, kind, unit };
    };
    const fromPercent = (pct: number | null, kcalPerGram: number) => pct === null ? null : (pct / 100) * calories / kcalPerGram;

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

/**
 * Tooltip text colour for a % of target, on one scale: blue very good, green good, yellow neutral, orange sort of bad,
 * red very bad. A limit is better the further under it; a range is best near its middle; for something to reach, more is
 * better (blue for a lot, which isn't bad, just worth calling out).
 */
export function targetColor(percent: number, kind: TargetKind): string {
    if (kind === 'max') {
        if (percent <= 50) return 'text-blue-300';
        if (percent <= 100) return 'text-green-300';
        if (percent <= 125) return 'text-yellow-300';
        if (percent <= 150) return 'text-orange-300';
        return 'text-red-400';
    }
    if (kind === 'range') {
        if (percent >= 90 && percent <= 110) return 'text-blue-300';
        if (percent >= 75 && percent <= 125) return 'text-green-300';
        if (percent >= 60 && percent <= 140) return 'text-yellow-300';
        if (percent >= 50 && percent <= 150) return 'text-orange-300';
        return 'text-red-400';
    }
    if (percent < 50) return 'text-red-400';
    if (percent < 75) return 'text-orange-300';
    if (percent < 125) return 'text-yellow-300';
    if (percent <= 250) return 'text-green-300';
    return 'text-blue-300';
}
