'use client';

import { useState, useCallback, useMemo } from 'react';
import { Table } from '../Table/Table';
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from './nutrition/FoodTableRda';
import { blendLandM2PerKg } from './nutrition/FoodTableCalculations';
import type { ColConfig, SliderValues, DataRegion } from './types/FoodTableTypes';
import { DIET_SLUG } from './types/FoodTableTypes';
import { FoodTableInputs } from './controls/FoodTableInputs';
import { COLUMN_CONFIG, DEFAULT_SLIDER_VALUES, DEFAULT_DATA_REGION } from './scoring/FoodTableDefaults';
import { FoodTableFilters, DEFAULT_FOOD_FILTER } from './controls/toolbar/FoodTableFilters';
import { FoodDetailModal } from './FoodDetail/FoodDetailModal';
import { useFoodTableData } from './scoring/useFoodTableData';
import { useTableDisplay } from './rows/useTableDisplay';
import { DietModal } from './diet/modal/DietModal';

export function FoodTable() {
    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [dataRegion, setDataRegion] = useState<DataRegion>(DEFAULT_DATA_REGION);
    const [foodFilter, setFoodFilter] = useState<string>(DEFAULT_FOOD_FILTER);
    // Whose recommended intakes the tooltips measure vitamins and minerals against
    const [nutrientStandard, setNutrientStandard] = useState<NutrientStandard>(DEFAULT_NUTRIENT_STANDARD);
    // UI state — activeCols updated synchronously by FoodTableInputs
    const [activeCols, setActiveCols] = useState<ColConfig[]>(() => COLUMN_CONFIG.filter(column => column.defaultVisible));
    // Food whose detail modal is open (null = closed)
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [showDiet, setShowDiet] = useState(false);
    // The diet's total calories per day, size and activity, for the whole-diet numbers in its tooltip
    const [dietSettings, setDietSettings] = useState<DietSettings | null>(null);

    const data = useFoodTableData(dataRegion, sliderValues);
    const { rawFoods, scored, customNutrition } = data;
    const cellInputs = useMemo(
        () => ({ nutrientStandard, dietSettings, customNutrition, onSelect: setSelectedSlug }),
        [nutrientStandard, dietSettings, customNutrition],
    );
    const display = useTableDisplay({ rawFoods, scored, foodFilter, activeCols, sliderValues, cellInputs });

    const closeDetail = useCallback(() => setSelectedSlug(null), []);
    const closeDiet = useCallback(() => setShowDiet(false), []);
    const showDietModal = useCallback(() => setShowDiet(true), []);
    // Grouped props are memoized so the (memoized) inputs only re-render when something in them changes.
    const dietHandlers = useMemo(
        () => ({ onCustomFoodChange: data.onCustomFoodChange, onSettingsChange: setDietSettings, onShow: showDietModal }),
        [data.onCustomFoodChange, showDietModal],
    );
    const dataSettings = useMemo(
        () => ({ dataRegion, onDataRegionChange: setDataRegion, nutrientStandard, onNutrientStandardChange: setNutrientStandard }),
        [dataRegion, nutrientStandard],
    );
    const scoringErrorBanner = useMemo(
        () => data.scoringError === null ? null : { message: data.scoringError, onDismiss: data.dismissScoringError },
        [data.scoringError, data.dismissScoringError],
    );

    if (data.error) return <p className="mt-6 text-red-600">Failed to load data: {data.error}</p>;
    if (data.loading) return <p className="mt-6 text-neutral-500">Loading food data…</p>;

    const rawLandOf = (slug: string) => scored.get(slug)?.land_use_detail.rawM2PerKg;
    const selectedFood = selectedSlug ? rawFoods.find(food => food.slug === selectedSlug) : undefined;
    const dietNutrition = customNutrition.get(DIET_SLUG);

    return (
        <div className="mt-6">
            <FoodTableInputs
                foods={rawFoods}
                onSliderValuesChange={setSliderValues}
                onActiveColsChange={setActiveCols}
                dataSettings={dataSettings}
                diet={dietHandlers}
                scoringError={scoringErrorBanner}
            />

            <FoodTableFilters selected={foodFilter} onChange={setFoodFilter} />

            <Table headers={display.headers}>
                {display.rows}
            </Table>

            {showDiet && dietNutrition && (
                <DietModal
                    nutrition={dietNutrition}
                    settings={{ diet: dietSettings, standard: nutrientStandard }}
                    scoring={{ scored, foodSlugs: data.foodSlugs, unit: display.unit }}
                    rawLandM2PerKg={{
                        diet: data.customFoodsBySlug[DIET_SLUG] ? blendLandM2PerKg(data.customFoodsBySlug[DIET_SLUG], rawFoods, rawLandOf) : null,
                        benchmark: data.averageDiet ? blendLandM2PerKg(data.averageDiet, rawFoods, rawLandOf) : null,
                    }}
                    onClose={closeDiet}
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
                    onClose={closeDetail}
                />
            )}
        </div>
    );
}
