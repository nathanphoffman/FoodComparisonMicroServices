'use client';

import { useMemo } from 'react';
import { Table } from '../Table/Table';
import { FoodTableInputs } from './controls/FoodTableInputs';
import { FoodTableFilters } from './controls/toolbar/FoodTableFilters';
import { useFoodTableState } from './controls/useFoodTableState';
import { useFoodTableData } from './scoring/useFoodTableData';
import { useTableDisplay } from './rows/useTableDisplay';
import { FoodTableModals } from './rows/FoodTableModals';

export function FoodTable() {
    const state = useFoodTableState();
    const { sliderValues, nutrientStandard, dietSettings } = state;
    const data = useFoodTableData(state.dataRegion, sliderValues);
    const cellInputs = useMemo(
        () => ({ nutrientStandard, dietSettings, dietNutrition: data.dietNutrition, onSelect: state.setSelectedSlug }),
        [nutrientStandard, dietSettings, data.dietNutrition, state.setSelectedSlug],
    );
    const display = useTableDisplay({
        rawFoods: data.rawFoods, scored: data.scored, foodFilter: state.foodFilter,
        activeCols: state.activeCols, sliderValues, cellInputs,
    });

    // Grouped props are memoized so the (memoized) inputs only re-render when something in them changes.
    const dietHandlers = useMemo(
        () => ({ onDietChange: data.onDietChange, onSettingsChange: state.setDietSettings, onShow: state.openDiet }),
        [data.onDietChange, state.setDietSettings, state.openDiet],
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
                onSliderValuesChange={state.setSliderValues}
                onActiveColsChange={state.setActiveCols}
                dataSettings={state.dataSettings}
                diet={dietHandlers}
                scoringError={scoringErrorBanner}
            />

            <FoodTableFilters selected={state.foodFilter} onChange={state.setFoodFilter} />

            <Table headers={display.headers}>
                {display.rows}
            </Table>

            <FoodTableModals
                data={data}
                sliderValues={sliderValues}
                display={display}
                diet={{ isOpen: state.showDiet, settings: dietSettings, standard: nutrientStandard, onClose: state.closeDiet }}
                detail={{ slug: state.selectedSlug, onClose: state.closeDetail }}
            />
        </div>
    );
}
