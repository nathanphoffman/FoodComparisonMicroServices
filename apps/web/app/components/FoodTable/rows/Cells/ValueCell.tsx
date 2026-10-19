import { Cell } from '../../../Table/Cell';

/** Grey dash shown in a cell when there is no value. */
export function EmptyValue() {
  return <span className="text-neutral-400">—</span>;
}

/** A right-aligned number cell: a grey dash when there is no value, otherwise whatever `children` draws for it. */
export function ValueCell({ value, children }: { value: number | null; children: (value: number) => React.ReactNode }) {
  return <Cell align="right">{value == null ? <EmptyValue /> : children(value)}</Cell>;
}
