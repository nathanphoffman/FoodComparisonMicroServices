import type { NutritionDetail } from '../../../types/FoodTableTypes';
import type { DietSettings, NutrientStandard } from '../../../nutrition/FoodTableRda';
import { getColor } from '../../FoodTableStyles';
import { NutritionTooltip } from '../../Tooltips/nutrition/NutritionTooltip';
import { ValueCell } from '../ValueCell';

function NutritionScore({ score }: { score: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getColor('nutritionScore', score)}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function NutritionScoreCell({ score, detail, diet, standard }: { score: number | null; detail: NutritionDetail; diet?: DietSettings | null; standard?: NutrientStandard }) {
  return (
    <ValueCell value={score}>
      {value => <NutritionTooltip detail={detail} diet={diet} standard={standard}><NutritionScore score={value} /></NutritionTooltip>}
    </ValueCell>
  );
}
