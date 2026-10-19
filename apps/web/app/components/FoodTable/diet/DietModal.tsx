import { Modal } from '../../Modals/Modal';
import { DietExplainer } from './DietExplainer';
import { DietImpact } from './DietImpact';
import { AVERAGE_DIET_SLUG } from './FoodTableAverageDiet';
import { NutritionDetailContent } from '../rows/Tooltips/NutritionTooltip';
import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import type { ScoredRow } from '../scoring/FoodTableSort';
import { DIET_SLUG, type NutritionDetail } from '../Types/FoodTableTypes';

type Props = {
    nutrition: NutritionDetail;
    dietSettings: DietSettings | null;
    nutrientStandard: NutrientStandard;
    scored: Map<string, ScoredRow>;
    foodSlugs: Set<string>;
    unit: string;
    /** Raw land use (m² per kg) of the diet and of the hidden average diet it's compared with. */
    rawLandM2PerKg: number | null;
    benchmarkRawLandM2PerKg: number | null;
    onClose: () => void;
};

/** The "Your Diet" window: its nutrition breakdown, its impact against the average diet, and how it's worked out. */
export function DietModal({ nutrition, dietSettings, nutrientStandard, scored, foodSlugs, unit, rawLandM2PerKg, benchmarkRawLandM2PerKg, onClose }: Props) {
    const dietRow = scored.get(DIET_SLUG);
    return (
        <Modal title="Your Diet" onClose={onClose} wide>
            <div className="bg-neutral-900 text-neutral-100 text-xs rounded-lg px-3 py-2.5 md:whitespace-nowrap">
                <NutritionDetailContent detail={nutrition} diet={dietSettings} standard={nutrientStandard} />
            </div>
            {dietRow && (
                <DietImpact
                    row={dietRow}
                    scored={scored}
                    foodSlugs={foodSlugs}
                    unit={unit}
                    dailyCalories={dietSettings?.calories ?? null}
                    caloriesPerGram={nutrition.calories}
                    benchmark={scored.get(AVERAGE_DIET_SLUG) ?? null}
                    benchmarkRawLandM2PerKg={benchmarkRawLandM2PerKg}
                    rawLandM2PerKg={rawLandM2PerKg}
                />
            )}
            <DietExplainer />
        </Modal>
    );
}
