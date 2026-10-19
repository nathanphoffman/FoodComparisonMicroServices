'use client';

import { useState, useCallback, useMemo } from 'react';
import { Table } from '../Table/Table';
import type { DietSettings } from './nutrition/FoodTableRda';
import { FoodTableInputs } from './controls/FoodTableInputs';
import { FoodTableFilters } from './controls/toolbar/FoodTableFilters';
import { useFoodTableSettings } from './controls/useFoodTableSettings';
import { useFoodTableData } from './scoring/useFoodTableData';
import { useTableDisplay } from './rows/useTableDisplay';
import { FoodTableModals } from './rows/FoodTableModals';

export function FoodTable() {
    const settings = useFoodTableSettings();
    const { sliderValues, nutrientStandard } = settings;
    // Food whose detail modal is open (null = closed)
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [showDiet, setShowDiet] = useState(false);
    // The diet's total calories per day, size and activity, for the whole-diet numbers in its tooltip
    const [dietSettings, setDietSettings] = useState<DietSettings | null>(null);

    const data = useFoodTableData(settings.dataRegion, sliderValues);
    const cellInputs = useMemo(
        () => ({ nutrientStandard, dietSettings, dietNutrition: data.dietNutrition, onSelect: setSelectedSlug }),
        [nutrientStandard, dietSettings, data.dietNutrition],
    );
    const display = useTableDisplay({
        rawFoods: data.rawFoods, scored: data.scored, foodFilter: settings.foodFilter,
        activeCols: settings.activeCols, sliderValues, cellInputs,
    });

    const closeDetail = useCallback(() => setSelectedSlug(null), []);
    const closeDiet = useCallback(() => setShowDiet(false), []);
    const showDietModal = useCallback(() => setShowDiet(true), []);
    // Grouped props are memoized so the (memoized) inputs only re-render when something in them changes.
    const dietHandlers = useMemo(
        () => ({ onDietChange: data.onDietChange, onSettingsChange: setDietSettings, onShow: showDietModal }),
        [data.onDietChange, showDietModal],
    );
    const scoringErrorBanner = useMemo(
        () => data.scoringError === null ? null : { message: data.scoringError, onDismiss: data.dismissScoringError },
        [data.scoringError, data.dismissScoringError],
    );

    if (data.error) return <p className="mt-6 text-red-600">Failed to load data: {data.error}</p>;
    if (data.loading) return <p className="mt-6 text-neutral-500">Loading food data…</p>;

    return (
        <div className="mt-6">
            <FoodTableInputs
                foods={data.rawFoods}
                onSliderValuesChange={settings.setSliderValues}
                onActiveColsChange={settings.setActiveCols}
                dataSettings={settings.dataSettings}
                diet={dietHandlers}
                scoringError={scoringErrorBanner}
            />

            <FoodTableFilters selected={settings.foodFilter} onChange={settings.setFoodFilter} />

            <Table headers={display.headers}>
                {display.rows}
            </Table>

            <FoodTableModals
                data={data}
                sliderValues={sliderValues}
                display={display}
                diet={{ isOpen: showDiet, settings: dietSettings, standard: nutrientStandard, onClose: closeDiet }}
                detail={{ slug: selectedSlug, onClose: closeDetail }}
            />
        </div>
    );
}
