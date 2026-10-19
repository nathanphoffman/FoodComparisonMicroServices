import { useCallback, useState } from 'react';
import type { RawFood, ScoredRow } from '../types/FoodTableTypes';

export type SortKey =
    | 'name'
    | 'rank'
    | 'nutritionScore'
    | 'emissions'
    | 'landUse'
    | 'directKill'
    | 'captiveSentience'
    | 'water'
    | 'sentientHarm'
    | 'finalScore'
    | 'availability';

/** The scored value each column sorts by; 'name' and 'rank' have none (the name sorts on the food itself). */
const SORT_FIELDS: Partial<Record<SortKey, 'nutritionScore' | 'emissions' | 'landUse' | 'water' | 'directKill' | 'captiveSentience' | 'sentientHarm' | 'finalScore' | 'availability'>> = {
    nutritionScore:   'nutritionScore',
    emissions:        'emissions',
    landUse:          'landUse',
    directKill:       'directKill',
    captiveSentience: 'captiveSentience',
    water:            'water',
    sentientHarm:     'sentientHarm',
    finalScore:       'finalScore',
    availability:     'availability',
};

// Columns where a bigger number is better, so the first click sorts them biggest first.
const HIGHER_IS_BETTER: SortKey[] = ['finalScore', 'nutritionScore', 'availability'];

/**
 * Encapsulates all sort state and logic for the FoodTable.
 *
 * Returns:
 *  - `columnSortProps(key)` — convenience props to spread onto a column header
 *  - `sortRows(foods, scored)` — returns the sorted RawFood array
 */
export function useFoodTableSort() {
    const [sortKey, setSortKey] = useState<SortKey | null>('finalScore');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir(HIGHER_IS_BETTER.includes(key) ? 'desc' : 'asc'); }
    }

    function columnSortProps(key: SortKey) {
        return { sorted: sortKey === key ? sortDir : undefined, onSort: () => handleSort(key) };
    }

    // Stable between renders unless the sort changes, so the table can be memoized on it
    const sortRows = useCallback((foods: RawFood[], scored: Map<string, ScoredRow>): RawFood[] => {
        if (!sortKey) return foods;

        return [...foods].sort((a, b) => {
            const scoredA = scored.get(a.slug);
            const scoredB = scored.get(b.slug);
            const field = SORT_FIELDS[sortKey];
            const valueA = sortKey === 'name' ? a.name : field ? scoredA?.[field] ?? null : null;
            const valueB = sortKey === 'name' ? b.name : field ? scoredB?.[field] ?? null : null;

            // A food with no value goes last whichever way the column is sorted, so gaps never lead the table.
            if (valueA === null && valueB === null) return 0;
            if (valueA === null) return 1;
            if (valueB === null) return -1;
            if (valueA === valueB) return 0;
            const cmp = valueA < valueB ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [sortKey, sortDir]);

    return { sortKey, sortDir, handleSort, columnSortProps, sortRows };
}
