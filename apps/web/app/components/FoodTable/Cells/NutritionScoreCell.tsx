import { Cell } from '../../Table/Cell';
import type { NutritionDetail } from '../FoodTableTypes';
import { getNutritionScoreColor } from '../FoodTableStyles';
import { NutritionTooltip } from '../Tooltips/NutritionTooltip';
import { EmptyValue } from './EmptyValue';

function NutritionScore({ score }: { score: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getNutritionScoreColor(score)}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function NutritionScoreCell({ score, detail, dailyCalories }: { score: number | null; detail: NutritionDetail; dailyCalories?: number | null }) {
  return (
    <Cell key="nutritionScore" align="right">
      {score != null
        ? <NutritionTooltip detail={detail} dailyCalories={dailyCalories}><NutritionScore score={score} /></NutritionTooltip>
        : <EmptyValue />
      }
    </Cell>
  );
}
