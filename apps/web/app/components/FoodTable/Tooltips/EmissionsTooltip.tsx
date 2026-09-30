import type { EmissionsBreakdown } from '../FoodTableTypes';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';

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
