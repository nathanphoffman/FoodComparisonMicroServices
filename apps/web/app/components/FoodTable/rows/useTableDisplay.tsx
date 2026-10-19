import { useMemo } from 'react';
import { Row } from '../../Table/Row';
import type { ScoredRow } from '../scoring/FoodTableSort';
import { useFoodTableSort } from '../scoring/FoodTableSort';
import { rankByImprovement } from '../scoring/FoodTableRanks';
import { foodsToShow } from '../controls/toolbar/FoodTableFilters';
import { getUnitLabel } from '../nutrition/FoodTableCalculations';
import { isCustomFoodSlug, type ColConfig, type RawFood, type SliderValues } from '../types/FoodTableTypes';
import { dynamicLabels, figureLabelsFor } from './FoodTableLabels';
import { foodTableCell, type CellContext } from './FoodTableCell';

type Inputs = {
    rawFoods: RawFood[];
    scored: Map<string, ScoredRow>;
    foodFilter: string;
    activeCols: ColConfig[];
    sliderValues: SliderValues;
    /** What the cells need besides the food: tooltips' daily-needs settings and the diet's nutrition. */
    cellInputs: Pick<CellContext, 'nutrientStandard' | 'dietSettings' | 'customNutrition' | 'onSelect'>;
};

/** The table's header labels and its rows (filtered, sorted, ranked), plus the labels the detail window reuses. */
export function useTableDisplay({ rawFoods, scored, foodFilter, activeCols, sliderValues, cellInputs }: Inputs) {
    const { columnSortProps, sortRows } = useFoodTableSort();
    const displayRows = useMemo(() => sortRows(foodsToShow(rawFoods, foodFilter, scored), scored), [rawFoods, foodFilter, scored, sortRows]);
    const { ranks, rankedCount } = useMemo(() => rankByImprovement(displayRows, scored), [displayRows, scored]);

    const unit = getUnitLabel(sliderValues.weights);
    const cellContext = useMemo(
        () => ({ ...cellInputs, unit, sliderValues, ranks, rankedCount }),
        [cellInputs, unit, sliderValues, ranks, rankedCount],
    );

    // Memoized so opening/closing a modal (or other unrelated state changes)
    // doesn't re-render every row and its tooltips.
    const rows = useMemo(() => displayRows.map(food => (
        <Row key={food.slug} className={isCustomFoodSlug(food.slug) ? 'bg-yellow-50' : undefined}>
            {activeCols.map(column => foodTableCell(column.key, food, scored.get(food.slug), cellContext))}
        </Row>
    )), [displayRows, scored, activeCols, cellContext]);

    const referenceName = rawFoods.find(food => food.slug === sliderValues.referenceSlug)?.name ?? sliderValues.referenceSlug;
    const labelOverrides = dynamicLabels(unit, referenceName);
    const headers = activeCols.map(column => ({
        label: labelOverrides[column.key] ?? column.label,
        // Rank follows the Improvement score, so it isn't a sort column of its own.
        ...(column.key === 'rank' ? {} : columnSortProps(column.key)),
    }));

    return { rows, headers, unit, referenceName, figureLabels: figureLabelsFor(labelOverrides) };
}
