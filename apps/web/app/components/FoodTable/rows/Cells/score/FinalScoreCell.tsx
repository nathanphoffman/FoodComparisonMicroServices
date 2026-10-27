import { getColor } from '../../FoodTableStyles';
import { ValueCell } from '../ValueCell';

export function FinalScoreCell({ ratio }: { ratio: number | null }) {
  return (
    <ValueCell value={ratio}>
      {score => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getColor('improvement', score)}`}>
          {score.toFixed(1)}x
        </span>
      )}

    </ValueCell>
  );
}
