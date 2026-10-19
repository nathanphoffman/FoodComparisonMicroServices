import type { RawFood } from '../../Types/FoodTableTypes';
import type { ScoredRow } from '../../scoring/FoodTableSort';
import { num, pct, type MathStep, type MathContext } from './MathShared';

/** Working for availability: production per unit of land. */
export function availabilityMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;
  if (row.availability == null) return [];
  const production = food.availability_gg;
  if (production == null) return [{ label: 'Availability', expression: 'no production figure, so it is set to 1 (the worst score)', result: '1' }];
  const units = production * divisor;
  const landM2 = row.land_use_detail.rawM2PerKg;
  if (landM2 === 0) {
    return [{ label: 'Production', expression: `${num(production)} Gg × ${num(divisor)} ${unit}s per kg (no farmland, so not divided by land)`, result: num(row.availability) }];
  }
  const landPerUnit = landM2 / divisor;
  return [
    { label: `Production (Gg of ${unit}s)`, expression: `${num(production)} Gg × ${num(divisor)} ${unit}s per kg`, result: num(units) },
    { label: `Land per ${unit} (m²)`, expression: `${num(landM2)} m² per kg ÷ ${num(divisor)}`, result: num(landPerUnit) },
    { label: 'Availability', expression: `production ÷ land per ${unit} = ${num(units)} ÷ ${num(landPerUnit)}`, result: num(row.availability) },
  ];
}

/** Working for the final score: each measure's ratio against the reference food, then their weighted mean. */
export function finalScoreMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders } = context;
  const detail = row.improvement_detail;
  if (row.final_score == null) return [];
  if (!detail) return [{ label: 'Improvement', expression: `this food has none of the Compare By unit, so it scores 0`, result: '0x' }];
  const ref = context.referenceRow;
  const measureLabel: Record<string, string> = {
    nutrition: 'Nutrition', emissions: 'CO₂e', landUse: 'Land use', water: 'Water', sentientHarm: 'Sentient harm', availability: 'Availability',
  };
  const values: Record<string, [number | null, number | null]> = {
    nutrition:    [row.nutrition_score, ref?.nutrition_score ?? null],
    emissions:    [row.emissions, ref?.emissions ?? null],
    landUse:      [row.land_use, ref?.land_use ?? null],
    water:        [row.water, ref?.water ?? null],
    sentientHarm: [row.sentient_harm, ref?.sentient_harm ?? null],
    availability: [row.availability, ref?.availability ?? null],
  };
  const higherIsBetter = (measure: string) => measure === 'nutrition' || measure === 'availability';
  const steps: MathStep[] = detail.terms.map(term => {
    const [foodValue, referenceValue] = values[term.measure];
    let expression: string;
    if (term.zeroCapped) {
      expression = `scored 0 (perfect), so it gets the batch's best ratio × ${num(sliders.zeroBetterMultiplier)}`;
    } else if (term.measure === 'nutrition') {
      expression = `food vs ${context.referenceName} (${num(foodValue ?? 0)} vs ${num(referenceValue ?? 0)}), both shifted so every score is positive`;
    } else if (higherIsBetter(term.measure)) {
      expression = `food ÷ ${context.referenceName} = ${num(foodValue ?? 0)} ÷ ${num(referenceValue ?? 0)}`;
    } else {
      expression = `${context.referenceName} ÷ food = ${num(referenceValue ?? 0)} ÷ ${num(foodValue ?? 0)}`;
    }
    return { label: `${measureLabel[term.measure]} ratio (weight ${pct(term.priority)})`, expression, result: `${num(term.ratio)}x` };
  });
  const meanName = Math.abs(detail.exponent) < 1e-9 ? 'weighted geometric mean'
    : detail.exponent === 1 ? 'weighted average'
    : `weighted power mean (exponent ${num(detail.exponent)}, from the Win Dampening slider)`;
  steps.push({ label: 'Combined', expression: `${meanName} of the ratios above, using the priority weights`, result: `${num(detail.mean)}x` });
  if (Math.abs(detail.wildPenalty - 1) > 1e-9) {
    steps.push({ label: 'Wild penalty', expression: `${num(detail.mean)} ÷ ${num(detail.wildPenalty)} (Over-Hunting / Over-Gathering slider)`, result: `${num(row.final_score)}x` });
  }
  return steps;
}
