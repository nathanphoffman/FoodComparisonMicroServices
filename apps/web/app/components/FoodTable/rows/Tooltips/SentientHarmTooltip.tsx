import type { SentientHarmDetail } from '../../types/FoodTableTypes';
import { formatIntelligenceValue } from '../../nutrition/FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../../Table/Tooltip';
import { ExplanationNote, TooltipFootnote } from './TooltipParts';

type HarmSection = {
  title: string;
  /** Intentional harm (killing, captivity) is added as is; accidental harm is divided by the Kill : Accident slider. */
  accidental: boolean;
  rows: [label: string, score: number][];
};

/** The tooltip's sections in display order. Rows with no score are dropped, and a section with no rows is dropped. */
function harmSections(detail: SentientHarmDetail): HarmSection[] {
  const sections: HarmSection[] = [
    { title: 'Direct kill', accidental: false, rows: [['Primary animal', detail.directKillScore]] },
    { title: 'Captivity', accidental: false, rows: [['Captive sentience cost', detail.captiveSentienceScore]] },
    { title: 'Pesticide & crop impact', accidental: true, rows: [
      ['Insects*', detail.insectScore], ['Bees*', detail.beeScore],
      ['Soil organisms*', detail.wormScore], ['Crop deforestation*', detail.deforestationScore],
    ] },
    { title: 'Feed crop impact', accidental: true, rows: [
      ['Feed insects*', detail.feedInsectScore], ['Feed bees*', detail.feedBeeScore],
      ['Feed soil organisms*', detail.feedWormScore], ['Feed crop deforestation*', detail.feedDeforestationScore],
    ] },
    { title: 'Pasture impact', accidental: true, rows: [['Pasture deforestation*', detail.pastureDeforestationScore]] },
    { title: 'Bycatch', accidental: true, rows: [['Discarded bycatch kill*', detail.bycatchScore]] },
  ];
  return sections
    .map(section => ({ ...section, rows: section.rows.filter(([, score]) => score > 0) }))
    .filter(section => section.rows.length > 0);
}

type Props = { detail: SentientHarmDetail; divisor?: number; killMultiplier: number; total: number; explanation?: string | null; children: React.ReactNode };

export function SentientHarmTooltip({ detail, divisor = 1, killMultiplier, total, explanation, children }: Props) {
  const perUnit = (value: number) => formatIntelligenceValue(value / divisor);
  // Mirrors the sentientHarm formula in wasm-calculations/src/calculations/per_food/row.rs:
  // intentional + accidental ÷ killMultiplier (at 0×, intentional harm is dropped).
  const showScore = (score: number, accidental: boolean) => {
    if (!accidental) return killMultiplier > 0 ? perUnit(score) : 'not counted at 0×';
    if (killMultiplier <= 0) return perUnit(score);
    return <>{perUnit(score)} ÷ {killMultiplier} = <span className="text-neutral-100">{formatIntelligenceValue(score / divisor / killMultiplier)}</span></>;
  };
  const sections = harmSections(detail);

  return (
    <Tooltip content={
      <>
        {sections.map(section => (
          <TooltipSection key={section.title} title={section.title}>
            {section.rows.map(([label, score]) => <TooltipRow key={label} label={label} value={showScore(score, section.accidental)} />)}
          </TooltipSection>
        ))}
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <TooltipRow label="Total" value={formatIntelligenceValue(total)} />
        </div>
        {sections.some(section => section.accidental) && (
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
