import type { RawFood } from '../../FoodTableTypes';
import type { ScoredRow } from '../../FoodTableSort';
import { GWP_CH4, GWP_N2O, SQUARE_METERS_PER_HA, num, pct, perUnitStep, type MathStep, type MathContext } from './MathShared';

/** Working for emissions, in kg CO₂e. */
export function emissionsMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;
  if (row.emissions == null) return [];
  const perKg = row.emissions * divisor;
  const breakdown = row.emissions_breakdown;
  const steps: MathStep[] = breakdown
    ? [{
        label: 'kg CO₂e per kg',
        expression: `CO₂ + CH₄ × ${GWP_CH4} + N₂O × ${GWP_N2O} + feed crops = ${num(breakdown.co2)} + ${num(breakdown.ch4 / GWP_CH4)} × ${GWP_CH4} + ${num(breakdown.n2o / GWP_N2O)} × ${GWP_N2O} + ${num(breakdown.feedEmissions ?? 0)}`,
        result: num(perKg),
      }]
    : [{ label: 'kg CO₂e per kg', expression: food.tags.includes('composite') ? 'ingredients\' farm emissions + processing' : 'published emissions per kg', result: num(perKg) }];
  return [...steps, perUnitStep(perKg, divisor, unit, row.emissions)];
}

/** Working for land use, in m². */
export function landUseMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { unit } = context;
  const divisor = row.divisor;
  if (row.land_use == null) return [];
  const detail = row.land_use_detail;
  const steps: MathStep[] = [];
  if (detail.type === 'plant') {
    if (!detail.yieldKilogramsPerHectare) return [{ label: 'm² per kg', expression: 'no farmland (wild-harvested or none recorded)', result: '0' }];
    steps.push({ label: 'm² per kg', expression: `${num(SQUARE_METERS_PER_HA)} m² ÷ yield ${num(detail.yieldKilogramsPerHectare)} kg/ha`, result: num(detail.rawM2PerKg) });
  } else {
    const pastureM2 = (detail.pastureHectaresPerKilogram ?? 0) * SQUARE_METERS_PER_HA;
    steps.push({
      label: 'm² per kg',
      expression: `grazing ${num(detail.pastureHectaresPerKilogram ?? 0)} ha × ${num(SQUARE_METERS_PER_HA)} + feed cropland ${num(detail.feedLandM2PerKg ?? 0)} m² = ${num(pastureM2)} + ${num(detail.feedLandM2PerKg ?? 0)}`,
      result: num(detail.rawM2PerKg),
    });
  }
  const weighted = detail.rawM2PerKg * detail.multiplier;
  steps.push({ label: 'Weighted by land type', expression: `${num(detail.rawM2PerKg)} × ${num(detail.multiplier)} (Land Use sliders over this food's land split)`, result: num(weighted) });
  steps.push(perUnitStep(weighted, divisor, unit, row.land_use));
  return steps;
}

/** Working for water, in litres. */
export function waterMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
  if (row.water == null) return [];
  const perKg = row.water * divisor;
  const { green, blue, grey } = row.water_detail;
  const source = food.type === 'animal' ? 'its feed crops' : 'the crop';
  const steps: MathStep[] = green != null && blue != null
    ? [{
        label: 'L per kg',
        expression: `blue + green × ${pct(sliders.greenWaterWeight)} + grey × ${pct(sliders.greyWaterWeight)} = ${num(blue)} + ${num(green)} × ${pct(sliders.greenWaterWeight)} + ${num(grey ?? 0)} × ${pct(sliders.greyWaterWeight)}`,
        result: num(perKg),
      }]
    : [{ label: 'L per kg', expression: `total water for ${source} (no green/blue/grey split)`, result: num(perKg) }];
  return [...steps, perUnitStep(perKg, divisor, unit, row.water)];
}
