import { ValueCell } from '../ValueCell';

export function RankCell({ rank, total }: { rank: number | null; total: number }) {
  return (
    <ValueCell value={rank}>
      {rankValue => (
        <>
          <span className="text-sm font-medium text-neutral-700">{rankValue}</span>
          <span className="text-[10px] text-neutral-400">/{total}</span>
        </>
      )}
    </ValueCell>
  );
}
