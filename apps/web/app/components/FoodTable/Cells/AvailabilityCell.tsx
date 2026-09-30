import { Cell } from '../../Table/Cell';
import { EmptyValue } from './EmptyValue';

export function AvailabilityCell({ value }: { value: number | null }) {
  if (value == null) return <Cell key="availability" align="right"><EmptyValue /></Cell>;
  return (
    <Cell key="availability" align="right">
      <span className="text-neutral-700">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
    </Cell>
  );
}
