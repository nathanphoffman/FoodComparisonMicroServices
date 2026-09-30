import type { IntelligenceDetail, KillDetail } from '../FoodTableTypes';
import { formatCount, formatNeurons } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';
import { ExplanationNote, TooltipFootnote } from './TooltipParts';

const PERCENT_MULTIPLIER = 100;

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

export function IntelligenceTooltip({ detail, killDetail, wildFishDeathsPerKg, explanation, children }: { detail: IntelligenceDetail; killDetail?: KillDetail | null; wildFishDeathsPerKg?: number | null; explanation?: string | null; children: React.ReactNode }) {
  return (
    <Tooltip content={
      <TooltipSection title="Intelligence score">
        {(detail.neuronCount > 0 || !wildFishDeathsPerKg) && <TooltipRow label="Neuron count" value={formatNeurons(detail.neuronCount)} />}
        {detail.weightKg != null && <TooltipRow label="Animal weight" value={`${detail.weightKg} kg`} />}
        {detail.yieldFraction != null && <TooltipRow label="Yield fraction" value={`${(detail.yieldFraction * PERCENT_MULTIPLIER).toFixed(0)}%`} />}
        {killDetail && <KillRows killDetail={killDetail} />}
        {wildFishDeathsPerKg != null && (
          <TooltipRow label="Wild fish killed for fishmeal / oil" value={`${formatCount(wildFishDeathsPerKg)} per kg`} />
        )}
        <TooltipFootnote>neuron and weight exponents adjustable via Intelligence Math sliders</TooltipFootnote>
        <ExplanationNote text={explanation} />
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}
