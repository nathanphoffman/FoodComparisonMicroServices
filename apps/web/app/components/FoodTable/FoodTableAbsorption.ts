import type { MicronutrientKey } from './FoodTableTypes';

// Some nutrients can only be absorbed up to a limit per meal, so eating a lot of one in a single meal
// wastes the rest, while spreading the same amount over several meals absorbs more.
// Modelled as: absorbed(x) = min(x, capPerMeal) + beyondCap × (x − capPerMeal) for the amount x in one meal,
// where beyondCap is the share that still gets through past the limit (passive absorption).
// The caps are rough, from the literature: B12 ~1.5 µg per meal (intrinsic factor limit), calcium ~500 mg,
// vitamin C ~200 mg. Units match the per-gram food data (µg, mg, mg).
const LIMITS: Partial<Record<MicronutrientKey, { capPerMeal: number; beyondCap: number }>> = {
    vitamin_b12: { capPerMeal: 1.5, beyondCap: 0.02 },
    calcium:     { capPerMeal: 500, beyondCap: 0.3 },
    vitamin_c:   { capPerMeal: 200, beyondCap: 0.3 },
};

export const ABSORPTION_NUTRIENTS = Object.keys(LIMITS) as MicronutrientKey[];

/** Meals a day the daily RDA is assumed to be spread over: the baseline for the penalty. */
export const BASELINE_MEALS = 3;

// The slider is the longest gap, in days, between eating a food on the list: 0.1 days is 10 meals a day, 10 days is
// one meal every 10 days. Internally the model works in meals per day (1 ÷ days).
export const MIN_DAYS_BETWEEN = 0.1;
export const MAX_DAYS_BETWEEN = 10;
export const DEFAULT_DAYS_BETWEEN = 0.3;
export const mealsPerDayFor = (daysBetween: number) => 1 / daysBetween;

function absorbed(perMeal: number, key: MicronutrientKey): number {
    const { capPerMeal, beyondCap } = LIMITS[key]!;
    return Math.min(perMeal, capPerMeal) + beyondCap * Math.max(perMeal - capPerMeal, 0);
}

/** Amount of a supplement pill's dose that is absorbed when taken in one sitting (all of it for nutrients with no limit). */
export function absorbedFromDose(key: MicronutrientKey, dose: number): number {
    return key in LIMITS ? absorbed(dose, key) : dose;
}

/** Share of the nutrient absorbed when `daily` is eaten over `meals` meals a day (meals under 1 means
 * the food is eaten on fewer days, so each time it arrives in one bigger dose). */
function efficiency(daily: number, meals: number, key: MicronutrientKey): number {
    return daily > 0 ? (meals * absorbed(daily / meals, key)) / daily : 1;
}

/**
 * How much of a food's daily amount of this nutrient still counts, relative to eating it over the
 * baseline number of meals (1 = no loss). Never above 1: more meals can't beat the RDA's own assumption.
 */
export function absorptionMultiplier(key: MicronutrientKey, dailyAmount: number, mealsPerDay: number): number {
    if (!(key in LIMITS) || dailyAmount <= 0) return 1;
    return Math.min(1, efficiency(dailyAmount, mealsPerDay, key) / efficiency(dailyAmount, BASELINE_MEALS, key));
}
