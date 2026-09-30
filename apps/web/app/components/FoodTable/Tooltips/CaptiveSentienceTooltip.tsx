import type { KillDetail } from '../FoodTableTypes';
import { formatCount, formatYears } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';
import { ExplanationNote, TooltipFootnote } from './TooltipParts';

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
        <TooltipFootnote>each year in captivity counts as {captivityMultiplier}× a death</TooltipFootnote>
        <ExplanationNote text={explanation} />
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}
