import { Cell } from '../../Table/Cell';
import { getImprovementColor } from '../FoodTableStyles';
import { EmptyValue } from './EmptyValue';

export function FinalScoreCell({ ratio }: { ratio: number | null }) {
  if (ratio == null) return <Cell key="finalScore" align="right"><EmptyValue /></Cell>;
  return (
    <Cell key="finalScore" align="right">
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getImprovementColor(ratio)}`}>
        {ratio.toFixed(1)}x
      </span>
    </Cell>
  );
}
