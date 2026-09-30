import { Cell } from '../../Table/Cell';
import type { EmissionsBreakdown } from '../FoodTableTypes';
import { getEmissionsColor } from '../FoodTableStyles';
import { EmissionsTooltip } from '../Tooltips/EmissionsTooltip';
import { EmptyValue } from './EmptyValue';

function EmissionsBadge({ value }: { value: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getEmissionsColor(value)}`}>
      {value.toFixed(1)}
    </span>
  );
}

export function EmissionsCell({ value, breakdown, divisor }: { value: number | null; breakdown?: EmissionsBreakdown; divisor: number }) {
  if (value == null) return <Cell key="emissions" align="right"><EmptyValue /></Cell>;
  if (breakdown) return <Cell key="emissions" align="right"><EmissionsTooltip breakdown={breakdown} divisor={divisor}><EmissionsBadge value={value} /></EmissionsTooltip></Cell>;
  return <Cell key="emissions" align="right"><EmissionsBadge value={value} /></Cell>;
}
