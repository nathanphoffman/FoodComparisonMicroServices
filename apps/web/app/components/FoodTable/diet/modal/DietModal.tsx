import { Modal } from '../../../Modals/Modal';
import { DietExplainer } from './DietExplainer';
import { DietImpact } from './DietImpact';
import { AVERAGE_DIET_SLUG } from '../FoodTableAverageDiet';
import { NutritionDetailContent } from '../../rows/Tooltips/nutrition/NutritionTooltip';
import type { DietSettings, NutrientStandard } from '../../nutrition/FoodTableRda';
import type { ScoredRow } from '../../types/FoodTableTypes';
import { DIET_SLUG, type NutritionDetail } from '../../types/FoodTableTypes';

type Props = {
    nutrition: NutritionDetail;

    /** The person's daily settings and whose recommended intakes the nutrition is measured against. */
    settings: { diet: DietSettings | null; standard: NutrientStandard };

    /** Every scored food, which of them are real foods (not diet rows), and the Compare By unit. */
    scoring: { scored: Map<string, ScoredRow>; foodSlugs: Set<string>; unit: string };

    /** Raw land use (m² per kg) of the diet and of the hidden average diet it's compared with. */
    rawLandM2PerKg: { diet: number | null; benchmark: number | null };
    onClose: () => void;
};

/** The "Your Diet" window: its nutrition breakdown, its impact against the average diet, and how it's worked out. */
export function DietModal({ nutrition, settings, scoring, rawLandM2PerKg, onClose }: Props) {
    const { scored, foodSlugs, unit } = scoring;
    const dietRow = scored.get(DIET_SLUG);

    return (
        <Modal title="Your Diet" onClose={onClose} wide>
            <div className="bg-neutral-900 text-neutral-100 text-xs rounded-lg px-3 py-2.5 md:whitespace-nowrap">
                <NutritionDetailContent detail={nutrition} diet={settings.diet} standard={settings.standard} />
            </div>
            {dietRow && (
                <DietImpact
                    row={dietRow}
                    others={[...scored.values()].filter(food => foodSlugs.has(food.slug))}
                    unit={unit}
                    amounts={{ dailyCalories: settings.diet?.calories ?? null, caloriesPerGram: nutrition.calories, rawLandM2PerKg: rawLandM2PerKg.diet }}
                    benchmark={{ row: scored.get(AVERAGE_DIET_SLUG) ?? null, rawLandM2PerKg: rawLandM2PerKg.benchmark }}
                />
            )}

            <DietExplainer />
        </Modal>
    );
}
