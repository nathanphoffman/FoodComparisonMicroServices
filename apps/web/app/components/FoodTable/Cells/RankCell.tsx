import { Cell } from '../../Table/Cell';
import { EmptyValue } from './EmptyValue';

export function RankCell({ rank, total }: { rank: number | null; total: number }) {
  if (rank == null) return <Cell key="rank" align="right"><EmptyValue /></Cell>;
  return (
    <Cell key="rank" align="right">
      <span className="text-sm font-medium text-neutral-700">{rank}</span>
      <span className="text-[10px] text-neutral-400">/{total}</span>
    </Cell>
  );
}
