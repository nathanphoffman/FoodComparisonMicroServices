import type { SentientHarmDetail } from '../FoodTableTypes';
import { formatIntelligenceValue } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';
import { ExplanationNote, TooltipFootnote } from './TooltipParts';

export function SentientHarmTooltip({ detail, divisor = 1, killMultiplier, total, explanation, children }: { detail: SentientHarmDetail; divisor?: number; killMultiplier: number; total: number; explanation?: string | null; children: React.ReactNode }) {
  const fmt = (v: number) => formatIntelligenceValue(v / divisor);
  // Mirrors the sentient_harm formula in wasm-calculations/src/calculations/row.rs:
  // intentional + accidental ÷ killMultiplier (at 0×, intentional harm is dropped).
  const intentional = (v: number) => killMultiplier > 0 ? fmt(v) : 'not counted at 0×';
  const accidental  = (v: number) => killMultiplier > 0
    ? <>{fmt(v)} ÷ {killMultiplier} = <span className="text-neutral-100">{formatIntelligenceValue(v / divisor / killMultiplier)}</span></>
    : fmt(v);

  // Accidental-harm rows per section; only rows with a score above 0 are shown.
  const plantRows: [string, number][] = [
    ['Insects*',            detail.insectScore],
    ['Bees*',               detail.beeScore],
    ['Soil organisms*',     detail.wormScore],
    ['Crop deforestation*', detail.deforestationScore],
  ];
  const feedRows: [string, number][] = [
    ['Feed insects*',            detail.feedInsectScore],
    ['Feed bees*',               detail.feedBeeScore],
    ['Feed soil organisms*',     detail.feedWormScore],
    ['Feed crop deforestation*', detail.feedDeforestationScore],
  ];
  const accidentalRows = (rows: [string, number][]) => rows
    .filter(([, score]) => score > 0)
    .map(([label, score]) => <TooltipRow key={label} label={label} value={accidental(score)} />);

  const hasDirectKill = detail.directKillScore > 0;
  const hasCaptivity  = detail.captiveSentienceScore > 0;
  const hasPlant      = plantRows.some(([, score]) => score > 0);
  const hasFeed       = feedRows.some(([, score]) => score > 0);
  const hasPasture    = detail.pastureDeforestationScore > 0;
  const hasBycatch    = detail.bycatchScore > 0;
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
        {hasPlant && <TooltipSection title="Pesticide &amp; crop impact">{accidentalRows(plantRows)}</TooltipSection>}
        {hasFeed && <TooltipSection title="Feed crop impact">{accidentalRows(feedRows)}</TooltipSection>}
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
        <TooltipFootnote>deaths × neuron_count^1.5 × lifespan, amortized over land lifetime</TooltipFootnote>
        <ExplanationNote text={explanation} />
      </>
    }>
      {children}
    </Tooltip>
  );
}
