import type { RawFood } from '../../../types/FoodTableTypes';
import type { ScoredRow } from '../../../types/FoodTableTypes';
import { GWP_CH4, GWP_N2O, SQUARE_METERS_PER_HA, formatNumber, formatShare, perUnitStep, type MathStep, type MathContext } from './MathShared';

/** Working for emissions, in kg CO₂e. */
export function emissionsMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;

  if (row.emissions == null) return [];
  const perKg = row.emissions * divisor;
  const breakdown = row.emissionsBreakdown;
  const steps: MathStep[] = breakdown
    ? [{
        label: 'kg CO₂e per kg',
        expression: `CO₂ + CH₄ × ${GWP_CH4} + N₂O × ${GWP_N2O} + feed crops = ${formatNumber(breakdown.co2)} + ${formatNumber(breakdown.ch4 / GWP_CH4)} × ${GWP_CH4} + ${formatNumber(breakdown.n2o / GWP_N2O)} × ${GWP_N2O} + ${formatNumber(breakdown.feedEmissions ?? 0)}`,
        result: formatNumber(perKg),
      }]

    : [{ label: 'kg CO₂e per kg', expression: food.tags.includes('composite') ? 'ingredients\' farm emissions + processing' : 'published emissions per kg', result: formatNumber(perKg) }];

  return [...steps, perUnitStep(perKg, divisor, unit, row.emissions)];
}

/** Working for land use, in m². */
export function landUseMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;

  if (row.landUse == null) return [];
  const detail = row.landUseDetail;
  const steps: MathStep[] = [];

  if (detail.type === 'plant') {
    if (!detail.yieldKilogramsPerHectare) return [{ label: 'm² per kg', expression: 'no farmland (wild-harvested or none recorded)', result: '0' }];
    steps.push({ label: 'm² per kg', expression: `${formatNumber(SQUARE_METERS_PER_HA)} m² ÷ yield ${formatNumber(detail.yieldKilogramsPerHectare)} kg/ha`, result: formatNumber(detail.rawM2PerKg) });
  } else {
    const pastureM2 = (detail.pastureHectaresPerKilogram ?? 0) * SQUARE_METERS_PER_HA;
    steps.push({
      label: 'm² per kg',
      expression: `grazing ${formatNumber(detail.pastureHectaresPerKilogram ?? 0)} ha × ${formatNumber(SQUARE_METERS_PER_HA)} + feed cropland ${formatNumber(detail.feedLandM2PerKg ?? 0)} m² = ${formatNumber(pastureM2)} + ${formatNumber(detail.feedLandM2PerKg ?? 0)}`,
      result: formatNumber(detail.rawM2PerKg),
    });
  }

  const weighted = detail.rawM2PerKg * detail.multiplier;
  steps.push({ label: 'Weighted by land type', expression: `${formatNumber(detail.rawM2PerKg)} × ${formatNumber(detail.multiplier)} (Land Use sliders over this food's land split)`, result: formatNumber(weighted) });
  steps.push(perUnitStep(weighted, divisor, unit, row.landUse));

  return steps;
}

/** Working for water, in litres. */
export function waterMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;

  if (row.water == null) return [];
  const perKg = row.water * divisor;
  const { green, blue, grey } = row.waterDetail;
  const source = food.type === 'animal' ? 'its feed crops' : 'the crop';
  const steps: MathStep[] = green != null && blue != null
    ? [{
        label: 'L per kg',
        expression: `blue + green × ${formatShare(sliders.greenWaterWeight)} + grey × ${formatShare(sliders.greyWaterWeight)} = ${formatNumber(blue)} + ${formatNumber(green)} × ${formatShare(sliders.greenWaterWeight)} + ${formatNumber(grey ?? 0)} × ${formatShare(sliders.greyWaterWeight)}`,
        result: formatNumber(perKg),
      }]

    : [{ label: 'L per kg', expression: `total water for ${source} (no green/blue/grey split)`, result: formatNumber(perKg) }];

  return [...steps, perUnitStep(perKg, divisor, unit, row.water)];
}
