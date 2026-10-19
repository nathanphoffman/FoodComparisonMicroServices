import type { RawFood } from '../../../types/FoodTableTypes';
import type { ScoredRow } from '../../../types/FoodTableTypes';
import { formatNumber, formatShare, type MathStep, type MathContext } from './MathShared';

/** Working for availability: production per unit of land. */
export function availabilityMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;
  if (row.availability == null) return [];
  const production = food.availability_gg;
  if (production == null) return [{ label: 'Availability', expression: 'no production figure, so it is set to 1 (the worst score)', result: '1' }];
  const units = production * divisor;
  const landM2 = row.landUseDetail.rawM2PerKg;
  if (landM2 === 0) {
    return [{ label: 'Production', expression: `${formatNumber(production)} Gg × ${formatNumber(divisor)} ${unit}s per kg (no farmland, so not divided by land)`, result: formatNumber(row.availability) }];
  }
  const landPerUnit = landM2 / divisor;
  return [
    { label: `Production (Gg of ${unit}s)`, expression: `${formatNumber(production)} Gg × ${formatNumber(divisor)} ${unit}s per kg`, result: formatNumber(units) },
    { label: `Land per ${unit} (m²)`, expression: `${formatNumber(landM2)} m² per kg ÷ ${formatNumber(divisor)}`, result: formatNumber(landPerUnit) },
    { label: 'Availability', expression: `production ÷ land per ${unit} = ${formatNumber(units)} ÷ ${formatNumber(landPerUnit)}`, result: formatNumber(row.availability) },
  ];
}

/** Working for the final score: each measure's ratio against the reference food, then their weighted mean. */
export function finalScoreMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders } = context;
  const detail = row.improvementDetail;
  if (row.finalScore == null) return [];
  if (!detail) return [{ label: 'Improvement', expression: `this food has none of the Compare By unit, so it scores 0`, result: '0x' }];
  const ref = context.referenceRow;
  const measureLabel: Record<string, string> = {
    nutrition: 'Nutrition', emissions: 'CO₂e', landUse: 'Land use', water: 'Water', sentientHarm: 'Sentient harm', availability: 'Availability',
  };
  const values: Record<string, [number | null, number | null]> = {
    nutrition:    [row.nutritionScore, ref?.nutritionScore ?? null],
    emissions:    [row.emissions, ref?.emissions ?? null],
    landUse:      [row.landUse, ref?.landUse ?? null],
    water:        [row.water, ref?.water ?? null],
    sentientHarm: [row.sentientHarm, ref?.sentientHarm ?? null],
    availability: [row.availability, ref?.availability ?? null],
  };
  const higherIsBetter = (measure: string) => measure === 'nutrition' || measure === 'availability';
  const steps: MathStep[] = detail.terms.map(term => {
    const [foodValue, referenceValue] = values[term.measure];
    let expression: string;
    if (term.zeroCapped) {
      expression = `scored 0 (perfect), so it gets the batch's best ratio × ${formatNumber(sliders.zeroBetterMultiplier)}`;
    } else if (term.measure === 'nutrition') {
      expression = `food vs ${context.referenceName} (${formatNumber(foodValue ?? 0)} vs ${formatNumber(referenceValue ?? 0)}), both shifted so every score is positive`;
    } else if (higherIsBetter(term.measure)) {
      expression = `food ÷ ${context.referenceName} = ${formatNumber(foodValue ?? 0)} ÷ ${formatNumber(referenceValue ?? 0)}`;
    } else {
      expression = `${context.referenceName} ÷ food = ${formatNumber(referenceValue ?? 0)} ÷ ${formatNumber(foodValue ?? 0)}`;
    }
    return { label: `${measureLabel[term.measure]} ratio (weight ${formatShare(term.priority)})`, expression, result: `${formatNumber(term.ratio)}x` };
  });
  const meanName = Math.abs(detail.exponent) < 1e-9 ? 'weighted geometric mean'
    : detail.exponent === 1 ? 'weighted average'
    : `weighted power mean (exponent ${formatNumber(detail.exponent)}, from the Win Dampening slider)`;
  steps.push({ label: 'Combined', expression: `${meanName} of the ratios above, using the priority weights`, result: `${formatNumber(detail.mean)}x` });
  if (Math.abs(detail.wildPenalty - 1) > 1e-9) {
    steps.push({ label: 'Wild penalty', expression: `${formatNumber(detail.mean)} ÷ ${formatNumber(detail.wildPenalty)} (Over-Hunting / Over-Gathering slider)`, result: `${formatNumber(row.finalScore)}x` });
  }
  return steps;
}
