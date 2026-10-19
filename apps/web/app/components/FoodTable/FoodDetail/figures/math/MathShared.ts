import type { ScoredRow } from '../../../types/FoodTableTypes';
import type { SliderValues } from '../../../types/FoodTableTypes';
import type { FigureKey } from '../FoodDetailFigures';
import { formatIntelligenceValue } from '../../../nutrition/FoodTableCalculations';

/** One line of a figure's working: label, the equation with this food's numbers, the result. */
export type MathStep = { label: string; expression: string; result: string };

export type MathContext = {
  sliders:       SliderValues;
  unit:          string;            // Compare By unit label, e.g. 'weighted unit'
  referenceRow:  ScoredRow | undefined;
  referenceName: string;
  figureLabels:  Record<FigureKey, string>;
};

// Display copies of constants in services/wasm-calculations. nutrition/ConstantsInSync.test.ts fails if they drift.
export const GWP_CH4 = 28;                        // emissions.rs
export const GWP_N2O = 265;
export const SQUARE_METERS_PER_HA = 10_000;       // eco/constants.rs

/** Plain numbers to 4 significant figures; huge harm scores as 1.2T etc. */
export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1e6) return formatIntelligenceValue(value);
  return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}

/** A percentage as text, e.g. 75 → "75%". */
export const formatShare = (percent: number) => `${formatNumber(percent)}%`;

/** Final 'per Compare By unit' step: per-kg value ÷ units in one kg. */
export function perUnitStep(perKg: number, divisor: number, unit: string, result: number): MathStep {
  return {
    label: `Per ${unit}`,
    expression: `${formatNumber(perKg)} ÷ ${formatNumber(divisor)} (${unit}s in 1 kg)`,
    result: formatNumber(result),
  };
}
