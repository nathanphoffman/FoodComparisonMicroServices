import { scaleColor, COLOR_SCALES } from '../../../nutrition/FoodTableTargets';
import type { DietSettings } from '../../../nutrition/FoodTableRda';

const CALORIES_PER_SCALE_UNIT = 100;

/** Colour for a whole-diet % of daily need; the cutoffs are in COLOR_SCALES. */
export const needColor = (percent: number) => scaleColor(percent, COLOR_SCALES.nutrient);

/**
 * How much to multiply a per-100-calorie amount by to get the whole day's amount (the diet's calories ÷ 100),
 * or null when the diet has no calorie total, so there are no whole-diet numbers.
 */
export function dayScaleOf(diet: DietSettings | null | undefined): number | null {
  return diet?.calories ? diet.calories / CALORIES_PER_SCALE_UNIT : null;
}
