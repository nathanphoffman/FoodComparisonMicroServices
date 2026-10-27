import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import { blendLandM2PerKg } from '../nutrition/FoodTableCalculations';
import type { SliderValues } from '../types/FoodTableTypes';
import type { FoodTableData } from '../scoring/useFoodTableData';
import { DietModal } from '../diet/modal/DietModal';
import { FoodDetailModal } from '../FoodDetail/FoodDetailModal';

type Props = {
    data: FoodTableData;
    sliderValues: SliderValues;

    /** What the header and detail window need to name the Compare By unit, the reference food and every figure. */
    display: { unit: string; referenceName: string; figureLabels: Parameters<typeof FoodDetailModal>[0]['labels'] };
    diet: { isOpen: boolean; settings: DietSettings | null; standard: NutrientStandard; onClose: () => void };

    /** The food whose detail window is open (null when none is). */
    detail: { slug: string | null; onClose: () => void };
};

/** The two windows the table opens: the whole-diet breakdown and a single food's details. */
export function FoodTableModals({ data, sliderValues, display, diet, detail }: Props) {
    const { rawFoods, scored, dietNutrition, diet: dietInput, averageDiet } = data;

    const rawLandOf = (slug: string) => scored.get(slug)?.landUseDetail.rawM2PerKg;
    const selectedFood = detail.slug ? rawFoods.find(food => food.slug === detail.slug) : undefined;

    return (
        <>
            {diet.isOpen && dietNutrition && (
                <DietModal
                    nutrition={dietNutrition}
                    settings={{ diet: diet.settings, standard: diet.standard }}
                    scoring={{ scored, foodSlugs: data.foodSlugs, unit: display.unit }}
                    rawLandM2PerKg={{
                        diet: dietInput ? blendLandM2PerKg(dietInput, rawFoods, rawLandOf) : null,
                        benchmark: averageDiet ? blendLandM2PerKg(averageDiet, rawFoods, rawLandOf) : null,
                    }}

                    onClose={diet.onClose}
                />
            )}

            {selectedFood && (
                <FoodDetailModal
                    food={selectedFood}
                    scoredRow={scored.get(selectedFood.slug)}
                    labels={display.figureLabels}
                    mathContext={{
                        sliders: sliderValues,
                        unit: display.unit,
                        referenceRow: scored.get(sliderValues.referenceSlug),
                        referenceName: display.referenceName,
                        figureLabels: display.figureLabels,
                    }}

                    onClose={detail.onClose}
                />
            )}

        </>
    );
}
