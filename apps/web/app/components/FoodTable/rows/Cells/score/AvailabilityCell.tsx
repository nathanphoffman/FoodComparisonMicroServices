import { ValueCell } from '../ValueCell';

export function AvailabilityCell({ value }: { value: number | null }) {
  return (
    <ValueCell value={value}>
      {availability => <span className="text-neutral-700">{availability.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>}
    </ValueCell>
  );
}
