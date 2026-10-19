'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table } from '../Table/Table';
import { Row } from '../Table/Row';
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from './nutrition/FoodTableRda';
import { getUnitLabel, blendLandM2PerKg } from './nutrition/FoodTableCalculations';
import type { ColConfig, SliderValues, DataRegion } from './types/FoodTableTypes';
import { DIET_SLUG, isCustomFoodSlug } from './types/FoodTableTypes';
import { useFoodTableSort } from './scoring/FoodTableSort';
import { useWasmScoring } from './scoring/FoodTableWASMIntegration';
import { FoodTableInputs } from './controls/FoodTableInputs';
import { COLUMN_CONFIG, DEFAULT_SLIDER_VALUES, DEFAULT_DATA_REGION } from './scoring/FoodTableDefaults';
import { FoodTableFilters, DEFAULT_FOOD_FILTER, foodsToShow } from './controls/FoodTableFilters';
import { FoodDetailModal } from './FoodDetail/FoodDetailModal';
import { useFoodData } from './scoring/useFoodData';
import { useCustomFoods } from './diet/useCustomFoods';
import { rankByImprovement } from './scoring/FoodTableRanks';
import { dynamicLabels, figureLabelsFor } from './rows/FoodTableLabels';
import { foodTableCell } from './rows/FoodTableCell';
import { DietModal } from './diet/DietModal';

export function FoodTable() {
    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [dataRegion, setDataRegion] = useState<DataRegion>(DEFAULT_DATA_REGION);
    const { rawFoods, loadingApi, error } = useFoodData(dataRegion);
    const [loadingScore, setLoadingScore] = useState(true);
    const [foodFilter, setFoodFilter] = useState<string>(DEFAULT_FOOD_FILTER);
    // Food whose detail modal is open (null = closed)
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const closeDetail = useCallback(() => setSelectedSlug(null), []);

    const { customFoodsBySlug, onCustomFoodChange, foodSlugs, averageDiet, scoredCustomFoods, customNutrition } = useCustomFoods(rawFoods);

    // Whose recommended intakes the tooltips measure vitamins and minerals against
    const [nutrientStandard, setNutrientStandard] = useState<NutrientStandard>(DEFAULT_NUTRIENT_STANDARD);
    const [showDiet, setShowDiet] = useState(false);
    const closeDiet = useCallback(() => setShowDiet(false), []);
    // The diet's total calories per day, size and activity, for the whole-diet numbers in its tooltip
    const [dietSettings, setDietSettings] = useState<DietSettings | null>(null);

    // WASM scoring — scored rows contain all scores, breakdowns, and divisors
    const { scored, scoringError, setScoringError } = useWasmScoring(rawFoods, sliderValues, scoredCustomFoods);
    const dismissScoringError = useCallback(() => setScoringError(null), [setScoringError]);

    const { columnSortProps, sortRows } = useFoodTableSort();

    // UI state — activeCols updated synchronously by FoodTableInputs
    const [activeCols, setActiveCols] = useState<ColConfig[]>(
        () => COLUMN_CONFIG.filter(column => column.defaultVisible)
    );

    useEffect(() => {
        if (scored && scored.size) setLoadingScore(false);
    }, [scored]);

    const displayRows = useMemo(() => sortRows(foodsToShow(rawFoods, foodFilter, scored), scored), [rawFoods, foodFilter, scored, sortRows]);

    const { ranks, rankedCount } = useMemo(() => rankByImprovement(displayRows, scored), [displayRows, scored]);

    const unit = getUnitLabel(sliderValues.weights);
    const cellContext = useMemo(
        () => ({ unit, sliderValues, nutrientStandard, dietSettings, customNutrition, ranks, rankedCount, onSelect: setSelectedSlug }),
        [unit, sliderValues, nutrientStandard, dietSettings, customNutrition, ranks, rankedCount],
    );

    // Memoized so opening/closing the detail modal (or other unrelated state changes)
    // doesn't re-render every row and its tooltips.
    const tableRows = useMemo(() => (
        displayRows.map(food => (
            <Row key={food.slug} className={isCustomFoodSlug(food.slug) ? 'bg-yellow-50' : undefined}>
                {activeCols.map(column => foodTableCell(column.key, food, scored.get(food.slug), cellContext))}
            </Row>
        ))
    ), [displayRows, scored, activeCols, cellContext]);
    const referenceName = rawFoods.find(f => f.slug === sliderValues.referenceSlug)?.name ?? sliderValues.referenceSlug;
    const labelOverrides = dynamicLabels(unit, referenceName);

    const figureLabels = figureLabelsFor(labelOverrides);
    const rawLandOf = (slug: string) => scored.get(slug)?.land_use_detail.rawM2PerKg;
    const selectedFood = selectedSlug ? rawFoods.find(food => food.slug === selectedSlug) : undefined;

    const headers = activeCols.map(column => ({
        label: labelOverrides[column.key] ?? column.label,
        // Rank follows the Improvement score, so it isn't a sort column of its own.
        ...(column.key === 'rank' ? {} : columnSortProps(column.key)),
    }));

    if (error)   return <p className="mt-6 text-red-600">Failed to load data: {error}</p>;
    if (loadingApi || loadingScore) return <p className="mt-6 text-neutral-500">Loading food data…</p>;

    return (
        <div className="mt-6">
            <FoodTableInputs
                onSliderValuesChange={setSliderValues}
                onCustomFoodChange={onCustomFoodChange}
                onDietSettingsChange={setDietSettings}
                onShowDiet={() => setShowDiet(true)}
                scoringError={scoringError}
                onDismissScoringError={dismissScoringError}
                onActiveColsChange={setActiveCols}
                foods={rawFoods}
                dataRegion={dataRegion}
                onDataRegionChange={setDataRegion}
                nutrientStandard={nutrientStandard}
                onNutrientStandardChange={setNutrientStandard}
            />

            <FoodTableFilters selected={foodFilter} onChange={setFoodFilter} />

            <Table headers={headers}>
                {tableRows}
            </Table>

            {showDiet && customNutrition.get(DIET_SLUG) && (
                <DietModal
                    nutrition={customNutrition.get(DIET_SLUG)!}
                    dietSettings={dietSettings}
                    nutrientStandard={nutrientStandard}
                    scored={scored}
                    foodSlugs={foodSlugs}
                    unit={unit}
                    rawLandM2PerKg={customFoodsBySlug[DIET_SLUG] ? blendLandM2PerKg(customFoodsBySlug[DIET_SLUG], rawFoods, rawLandOf) : null}
                    benchmarkRawLandM2PerKg={averageDiet ? blendLandM2PerKg(averageDiet, rawFoods, rawLandOf) : null}
                    onClose={closeDiet}
                />
            )}

            {selectedFood && (
                <FoodDetailModal
                    food={selectedFood}
                    scoredRow={scored.get(selectedFood.slug)}
                    labels={figureLabels}
                    mathContext={{
                        sliders: sliderValues,
                        unit,
                        referenceRow: scored.get(sliderValues.referenceSlug),
                        referenceName,
                        figureLabels,
                    }}
                    onClose={closeDetail}
                />
            )}
        </div>
    );
}
