import type { LandUseDetail } from '../FoodTableTypes';
import type { LandTypes } from '../FoodTableTypes';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';
import { LAND_TYPE_LABELS } from '../Sliders/LandTypeSliders';
import { formatPerUnit } from './TooltipParts';

const SQUARE_METERS_PER_HECTARE = 10_000;

export function LandUseTooltip({ detail, divisor, unit, children }: { detail: LandUseDetail; divisor: number; unit: string; children: React.ReactNode }) {
  const hasBreakdown = detail.type === 'animal'
    && (detail.pastureHectaresPerKilogram != null || detail.feedLandM2PerKg != null);

  return (
    <Tooltip content={<>
      <TooltipSection title="Land use breakdown">
        {detail.type === 'plant' && detail.yieldKilogramsPerHectare != null && (
          <TooltipRow label="Crop yield" value={`${detail.yieldKilogramsPerHectare.toLocaleString()} kg/ha`} />
        )}
        {hasBreakdown && detail.pastureHectaresPerKilogram != null && (
          <TooltipRow
            label="Pasture"
            value={`${formatPerUnit(detail.pastureHectaresPerKilogram * SQUARE_METERS_PER_HECTARE, divisor)} m²/${unit}`}
          />
        )}
        {hasBreakdown && detail.feedLandM2PerKg != null && (
          <TooltipRow
            label="Feed crops"
            value={`${formatPerUnit(detail.feedLandM2PerKg, divisor)} m²/${unit}`}
          />
        )}
      </TooltipSection>
      {detail.landTypes && (
        <TooltipSection title="Land type weighting">
          {(Object.entries(detail.landTypes) as [keyof LandTypes, number][])
            .filter(([, fraction]) => fraction > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([key, fraction]) => (
              <TooltipRow key={key} label={LAND_TYPE_LABELS[key]} value={`${Math.round(fraction * 100)}%`} />
            ))}
          <TooltipRow label="Actual area" value={`${formatPerUnit(detail.rawM2PerKg, divisor)} m²/${unit}`} />
          <TooltipRow label="Land type weight" value={`× ${detail.multiplier.toFixed(2)}`} />
        </TooltipSection>
      )}
    </>}>
      {children}
    </Tooltip>
  );
}
