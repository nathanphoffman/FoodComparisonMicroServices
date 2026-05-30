import type { EcoDestructionDetail, EmissionsBreakdown, IntelligenceDetail, LandUseDetail, NutritionDetail, WaterDetail } from './FoodTableTypes';
import { formatIntelligenceValue, formatNeurons, nutritionScale } from './FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../Table/Tooltip';

const MILLIGRAMS_PER_GRAM = 1000;
const PERCENT_MULTIPLIER  = 100;

export function EmissionsTooltip({ breakdown, divisor, children }: { breakdown: EmissionsBreakdown; divisor: number; children: React.ReactNode }) {
  return (
    <Tooltip content={
      <TooltipSection title="Emissions breakdown">
        <TooltipRow label="CO₂" value={`${(breakdown.co2 / divisor).toFixed(1)} kg CO₂e`} />
        <TooltipRow label="CH₄ (as CO₂e)" value={`${(breakdown.ch4 / divisor).toFixed(1)} kg CO₂e`} />
        <TooltipRow label="N₂O (as CO₂e)" value={`${(breakdown.n2o / divisor).toFixed(1)} kg CO₂e`} />
        {breakdown.feedEmissions != null && (
          <TooltipRow label="Feed crops" value={`${(breakdown.feedEmissions / divisor).toFixed(1)} kg CO₂e`} />
        )}
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function NutritionTooltip({ detail, children }: { detail: NutritionDetail; children: React.ReactNode }) {
  const scale = nutritionScale(detail.calories);
  return (
    <Tooltip content={
      <TooltipSection title="Nutrition (per 100 cal)">
        <TooltipRow label="Total fat" value={`${(detail.fat * scale).toFixed(1)} g`} />
        <TooltipRow label="Sat. fat" value={`${(detail.saturatedFat * scale).toFixed(1)} g`} />
        {detail.transFat != null && <TooltipRow label="Trans fat" value={`${(detail.transFat * scale).toFixed(1)} g`} />}
        {detail.cholesterol != null && <TooltipRow label="Cholesterol" value={`${(detail.cholesterol * scale).toFixed(0)} mg`} />}
        {detail.sodium != null && <TooltipRow label="Sodium" value={`${(detail.sodium * scale).toFixed(0)} mg`} />}
        {detail.carbs != null && <TooltipRow label="Total carbs" value={`${(detail.carbs * scale).toFixed(1)} g`} />}
        <TooltipRow label="Fiber" value={`${(detail.fiber * scale).toFixed(1)} g`} />
        {detail.sugar != null && <TooltipRow label="Sugar" value={`${(detail.sugar * scale).toFixed(1)} g`} />}
        <TooltipRow label="Protein" value={`${(detail.protein * scale).toFixed(1)} g`} />
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function LandUseTooltip({ detail, divisor, unit, children }: { detail: LandUseDetail; divisor: number; unit: string; children: React.ReactNode }) {
  const hasBreakdown = detail.type === 'animal'
    && (detail.pastureHectaresPerKilogram != null || detail.feedLandM2PerKg != null);

  const fmt = (m2PerKg: number) =>
    (m2PerKg / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <Tooltip content={
      <TooltipSection title="Land use breakdown">
        {detail.type === 'plant' && detail.yieldKilogramsPerHectare != null && (
          <TooltipRow label="Crop yield" value={`${detail.yieldKilogramsPerHectare.toLocaleString()} kg/ha`} />
        )}
        {hasBreakdown && detail.pastureHectaresPerKilogram != null && (
          <TooltipRow
            label="Pasture"
            value={`${fmt(detail.pastureHectaresPerKilogram * 10000)} m²/${unit}`}
          />
        )}
        {hasBreakdown && detail.feedLandM2PerKg != null && (
          <TooltipRow
            label="Feed crops"
            value={`${fmt(detail.feedLandM2PerKg)} m²/${unit}`}
          />
        )}
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function WaterTooltip({ detail, referenceTotal, divisor, unit, greenWaterWeight, greyWaterWeight, children }: {
  detail: WaterDetail;
  referenceTotal: number | null;
  divisor: number;
  unit: string;
  greenWaterWeight: number;
  greyWaterWeight: number;
  children: React.ReactNode;
}) {
  const fmt = (raw: number) =>
    (raw / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 });

  const weightedGreen = detail.green != null ? (greenWaterWeight / 100) * detail.green : null;
  const weightedGrey  = detail.grey  != null ? (greyWaterWeight  / 100) * detail.grey  : null;

  return (
    <Tooltip content={
      <TooltipSection title="Water breakdown">
        {detail.blue  != null && <TooltipRow label="Blue (irrigation)"  value={`${fmt(detail.blue)} L/${unit}`} />}
        {weightedGreen != null && <TooltipRow label="Green (rain)"      value={`${fmt(weightedGreen)} L/${unit}`} />}
        {weightedGrey  != null && <TooltipRow label="Grey (pollution)"  value={`${fmt(weightedGrey)} L/${unit}`} />}
        {referenceTotal != null && (
          <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">
            Reference total (independent source): {referenceTotal.toLocaleString()} L/kg
          </div>
        )}
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function IntelligenceTooltip({ detail, children }: { detail: IntelligenceDetail; children: React.ReactNode }) {
  return (
    <Tooltip content={
      <TooltipSection title="Intelligence score">
        <TooltipRow label="Neuron count" value={formatNeurons(detail.neuronCount)} />
        {detail.weightKg != null && <TooltipRow label="Animal weight" value={`${detail.weightKg} kg`} />}
        {detail.yieldFraction != null && <TooltipRow label="Yield fraction" value={`${(detail.yieldFraction * PERCENT_MULTIPLIER).toFixed(0)}%`} />}
        <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">neuron and weight exponents adjustable via Intelligence Math sliders</div>
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function EcoDestructionTooltip({ detail, divisor = 1, children }: { detail: EcoDestructionDetail; divisor?: number; children: React.ReactNode }) {
  const fmt = (v: number) => formatIntelligenceValue(v / divisor);
  const hasDirectKill = detail.directKillScore > 0;
  const hasPlant   = detail.insectScore > 0 || detail.beeScore > 0 || detail.wormScore > 0 || detail.deforestationScore > 0;
  const hasFeed    = detail.feedInsectScore > 0 || detail.feedBeeScore > 0 || detail.feedWormScore > 0 || detail.feedDeforestationScore > 0;
  const hasPasture = detail.pastureDeforestationScore > 0;
  const hasBycatch = detail.bycatchScore > 0;
  return (
    <Tooltip content={
      <>
        {hasDirectKill && (
          <TooltipSection title="Direct kill">
            <TooltipRow label="Primary animal" value={fmt(detail.directKillScore)} />
          </TooltipSection>
        )}
        {hasPlant && (
          <TooltipSection title="Pesticide &amp; crop impact">
            {detail.insectScore        > 0 && <TooltipRow label="Insects"            value={fmt(detail.insectScore)} />}
            {detail.beeScore           > 0 && <TooltipRow label="Bees"               value={fmt(detail.beeScore)} />}
            {detail.wormScore          > 0 && <TooltipRow label="Soil organisms"     value={fmt(detail.wormScore)} />}
            {detail.deforestationScore > 0 && <TooltipRow label="Crop deforestation" value={fmt(detail.deforestationScore)} />}
          </TooltipSection>
        )}
        {hasFeed && (
          <TooltipSection title="Feed crop impact">
            {detail.feedInsectScore        > 0 && <TooltipRow label="Feed insects"            value={fmt(detail.feedInsectScore)} />}
            {detail.feedBeeScore           > 0 && <TooltipRow label="Feed bees"               value={fmt(detail.feedBeeScore)} />}
            {detail.feedWormScore          > 0 && <TooltipRow label="Feed soil organisms"     value={fmt(detail.feedWormScore)} />}
            {detail.feedDeforestationScore > 0 && <TooltipRow label="Feed crop deforestation" value={fmt(detail.feedDeforestationScore)} />}
          </TooltipSection>
        )}
        {hasPasture && (
          <TooltipSection title="Pasture impact">
            <TooltipRow label="Pasture deforestation" value={fmt(detail.pastureDeforestationScore)} />
          </TooltipSection>
        )}
        {hasBycatch && (
          <TooltipSection title="Bycatch">
            <TooltipRow label="Discarded bycatch kill" value={fmt(detail.bycatchScore)} />
          </TooltipSection>
        )}
        <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">deaths × neuron_count^1.5 × lifespan, amortized over land lifetime</div>
      </>
    }>
      {children}
    </Tooltip>
  );
}
