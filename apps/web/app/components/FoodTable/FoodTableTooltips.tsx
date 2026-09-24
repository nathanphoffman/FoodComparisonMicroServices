import type { SentientHarmDetail, EmissionsBreakdown, IntelligenceDetail, KillDetail, LandUseDetail, NutritionDetail, WaterDetail } from './FoodTableTypes';
import { formatCount, formatIntelligenceValue, formatNeurons, formatYears, nutritionScale } from './FoodTableCalculations';
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

/** Food-specific plain-English explanation from the data (sentient_harm_explanation). */
function ExplanationNote({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-300 text-xs whitespace-normal w-80">{text}</div>;
}

/** "1 cow + 2 offspring" style rows — who dies per producing animal, and how much food it yields. */
function KillRows({ killDetail }: { killDetail: KillDetail }) {
  return (
    <>
      <TooltipRow label="Food per animal" value={`${formatCount(killDetail.outputKgPerDeath)} kg`} />
      <TooltipRow
        label="Deaths per animal"
        value={killDetail.offspringDeaths > 0 ? `1 + ${formatCount(killDetail.offspringDeaths)} offspring` : '1'}
      />
    </>
  );
}

export function IntelligenceTooltip({ detail, killDetail, explanation, children }: { detail: IntelligenceDetail; killDetail?: KillDetail | null; explanation?: string | null; children: React.ReactNode }) {
  return (
    <Tooltip content={
      <TooltipSection title="Intelligence score">
        <TooltipRow label="Neuron count" value={formatNeurons(detail.neuronCount)} />
        {detail.weightKg != null && <TooltipRow label="Animal weight" value={`${detail.weightKg} kg`} />}
        {detail.yieldFraction != null && <TooltipRow label="Yield fraction" value={`${(detail.yieldFraction * PERCENT_MULTIPLIER).toFixed(0)}%`} />}
        {killDetail && <KillRows killDetail={killDetail} />}
        <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">neuron and weight exponents adjustable via Intelligence Math sliders</div>
        <ExplanationNote text={explanation} />
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function CaptiveSentienceTooltip({ killDetail, captivityMultiplier, explanation, children }: { killDetail: KillDetail; captivityMultiplier: number; explanation?: string | null; children: React.ReactNode }) {
  const hasOffspring = killDetail.offspringDeaths > 0;
  return (
    <Tooltip content={
      <TooltipSection title="Captivity">
        <TooltipRow label="Animal in captivity" value={formatYears(killDetail.captivityYears)} />
        {hasOffspring && (
          <TooltipRow
            label="Offspring in captivity"
            value={`${formatCount(killDetail.offspringDeaths)} × ${formatYears(killDetail.offspringCaptivityYears)}`}
          />
        )}
        <TooltipRow label="Food per animal" value={`${formatCount(killDetail.outputKgPerDeath)} kg`} />
        <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">each year in captivity counts as {captivityMultiplier}× a death</div>
        <ExplanationNote text={explanation} />
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}

export function SentientHarmTooltip({ detail, divisor = 1, killMultiplier, total, explanation, children }: { detail: SentientHarmDetail; divisor?: number; killMultiplier: number; total: number; explanation?: string | null; children: React.ReactNode }) {
  const fmt = (v: number) => formatIntelligenceValue(v / divisor);
  // Mirrors the sentient_harm formula in wasm-calculations/src/calculations/mod.rs:
  // intentional + accidental ÷ killMultiplier (at 0×, intentional harm is dropped).
  const intentional = (v: number) => killMultiplier > 0 ? fmt(v) : 'not counted at 0×';
  const accidental  = (v: number) => killMultiplier > 0
    ? <>{fmt(v)} ÷ {killMultiplier} = <span className="text-neutral-100">{formatIntelligenceValue(v / divisor / killMultiplier)}</span></>
    : fmt(v);
  const hasDirectKill = detail.directKillScore > 0;
  const hasCaptivity = detail.captiveSentienceScore > 0;
  const hasPlant   = detail.insectScore > 0 || detail.beeScore > 0 || detail.wormScore > 0 || detail.deforestationScore > 0;
  const hasFeed    = detail.feedInsectScore > 0 || detail.feedBeeScore > 0 || detail.feedWormScore > 0 || detail.feedDeforestationScore > 0;
  const hasPasture = detail.pastureDeforestationScore > 0;
  const hasBycatch = detail.bycatchScore > 0;
  const hasAccidental = hasPlant || hasFeed || hasPasture || hasBycatch;
  return (
    <Tooltip content={
      <>
        {hasDirectKill && (
          <TooltipSection title="Direct kill">
            <TooltipRow label="Primary animal" value={intentional(detail.directKillScore)} />
          </TooltipSection>
        )}
        {hasCaptivity && (
          <TooltipSection title="Captivity">
            <TooltipRow label="Captive sentience cost" value={intentional(detail.captiveSentienceScore)} />
          </TooltipSection>
        )}
        {hasPlant && (
          <TooltipSection title="Pesticide &amp; crop impact">
            {detail.insectScore        > 0 && <TooltipRow label="Insects*"            value={accidental(detail.insectScore)} />}
            {detail.beeScore           > 0 && <TooltipRow label="Bees*"               value={accidental(detail.beeScore)} />}
            {detail.wormScore          > 0 && <TooltipRow label="Soil organisms*"     value={accidental(detail.wormScore)} />}
            {detail.deforestationScore > 0 && <TooltipRow label="Crop deforestation*" value={accidental(detail.deforestationScore)} />}
          </TooltipSection>
        )}
        {hasFeed && (
          <TooltipSection title="Feed crop impact">
            {detail.feedInsectScore        > 0 && <TooltipRow label="Feed insects*"            value={accidental(detail.feedInsectScore)} />}
            {detail.feedBeeScore           > 0 && <TooltipRow label="Feed bees*"               value={accidental(detail.feedBeeScore)} />}
            {detail.feedWormScore          > 0 && <TooltipRow label="Feed soil organisms*"     value={accidental(detail.feedWormScore)} />}
            {detail.feedDeforestationScore > 0 && <TooltipRow label="Feed crop deforestation*" value={accidental(detail.feedDeforestationScore)} />}
          </TooltipSection>
        )}
        {hasPasture && (
          <TooltipSection title="Pasture impact">
            <TooltipRow label="Pasture deforestation*" value={accidental(detail.pastureDeforestationScore)} />
          </TooltipSection>
        )}
        {hasBycatch && (
          <TooltipSection title="Bycatch">
            <TooltipRow label="Discarded bycatch kill*" value={accidental(detail.bycatchScore)} />
          </TooltipSection>
        )}
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <TooltipRow label="Total" value={formatIntelligenceValue(total)} />
        </div>
        {hasAccidental && (
          <div className="mt-2 text-neutral-500 text-xs max-w-xs">
            * Accidental deaths (crops, pesticides, habitat loss, bycatch) are divided by the Kill : Accident slider ({killMultiplier}×), because intentionally killing an animal is weighted as worse than killing one by accident.
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">deaths × neuron_count^1.5 × lifespan, amortized over land lifetime</div>
        <ExplanationNote text={explanation} />
      </>
    }>
      {children}
    </Tooltip>
  );
}
