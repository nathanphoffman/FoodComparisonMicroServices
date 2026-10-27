import type { EmissionsBreakdown } from '../../../types/FoodTableTypes';
import { getColor } from '../../FoodTableStyles';
import { EmissionsTooltip } from '../../Tooltips/EmissionsTooltip';
import { ValueCell } from '../ValueCell';

function EmissionsBadge({ value }: { value: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getColor('emissions', value)}`}>
      {value.toFixed(1)}
    </span>
  );
}

export function EmissionsCell({ value, breakdown, divisor }: { value: number | null; breakdown?: EmissionsBreakdown; divisor: number }) {
  return (
    <ValueCell value={value}>
      {emissions => breakdown
        ? <EmissionsTooltip breakdown={breakdown} divisor={divisor}><EmissionsBadge value={emissions} /></EmissionsTooltip>
        : <EmissionsBadge value={emissions} />
      }

    </ValueCell>
  );
}
