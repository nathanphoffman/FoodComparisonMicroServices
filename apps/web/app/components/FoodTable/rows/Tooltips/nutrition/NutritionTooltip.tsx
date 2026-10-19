import type { NutritionDetail } from '../../../types/FoodTableTypes';
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from '../../../nutrition/FoodTableRda';
import { Tooltip } from '../../../../Table/Tooltip';
import { MacroSection } from './MacroSection';
import { MicronutrientSection } from './MicronutrientSection';
import { AminoAcidSection } from './AminoAcidSection';

// diet (diet row only) holds the user's whole-day calories, sex and age. Calories scale the per-100-calorie
// amounts up to the whole day, so 10% per 100 cal on a 2000 cal diet reads (200%); sex and age pick
// their own daily need for each nutrient instead of the FDA daily value.
type Props = { detail: NutritionDetail; diet?: DietSettings | null; standard?: NutrientStandard };

// The nutrition breakdown shown in a food's tooltip and in the Diet modal.
export function NutritionDetailContent({ detail, diet, standard = DEFAULT_NUTRIENT_STANDARD }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <MacroSection detail={detail} diet={diet} standard={standard} />
      <MicronutrientSection detail={detail} diet={diet} standard={standard} />
      <AminoAcidSection detail={detail} />
    </div>
  );
}

export function NutritionTooltip({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <Tooltip content={<NutritionDetailContent {...props} />}>
      {children}
    </Tooltip>
  );
}
