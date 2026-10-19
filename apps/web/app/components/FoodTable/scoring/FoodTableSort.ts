import { useCallback, useState } from 'react';
import type { RawFood } from '../Types/FoodTableTypes';
import type { SentientHarmDetail, EmissionsBreakdown, LandUseDetail, WaterDetail, KillDetail, ImprovementDetail } from '../Types/FoodTableTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

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

/** Shape returned by the WASM scorer. */
export type ScoredRow = {
    slug:      string;
    name:      string;
    food_type: string;
    divisor:   number;

    // Aggregate scores
    nutrition_score: number | null;
    emissions:       number | null;
    land_use:        number | null;
    water:           number | null;
    direct_kill:     number | null;
    captive_sentience: number | null;
    sentient_harm:   number | null;
    final_score:     number | null;
    availability:    number | null;

    // Tooltip breakdown details (camelCase, matching Rust serde rename_all)
    emissions_breakdown?:  EmissionsBreakdown;
    water_detail:          WaterDetail;
    land_use_detail:       LandUseDetail;
    sentient_harm_detail:  SentientHarmDetail;
    kill_detail:           KillDetail | null;
    // Wild fish killed per kg for fishmeal / fish oil; null if none
    wild_fish_deaths_per_kg: number | null;
    // Intelligence-weighted kill of those fish, per kg (part of direct kill)
    wild_fish_kill: number;
    // How final_score was built; null when final_score is null or 0 by default
    improvement_detail: ImprovementDetail | null;
};

/** The scored value each column sorts by; 'name' and 'rank' have none (the name sorts on the food itself). */
const SORT_FIELDS: Partial<Record<SortKey, 'nutrition_score' | 'emissions' | 'land_use' | 'water' | 'direct_kill' | 'captive_sentience' | 'sentient_harm' | 'final_score' | 'availability'>> = {
    nutritionScore:   'nutrition_score',
    emissions:        'emissions',
    landUse:          'land_use',
    directKill:       'direct_kill',
    captiveSentience: 'captive_sentience',
    water:            'water',
    sentientHarm:     'sentient_harm',
    finalScore:       'final_score',
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
            const sa = scored.get(a.slug);
            const sb = scored.get(b.slug);
            const field = SORT_FIELDS[sortKey];
            const va = sortKey === 'name' ? a.name : field ? sa?.[field] ?? null : null;
            const vb = sortKey === 'name' ? b.name : field ? sb?.[field] ?? null : null;

            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            if (va === vb) return 0;
            const cmp = va < vb ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [sortKey, sortDir]);

    return { sortKey, sortDir, handleSort, columnSortProps, sortRows };
}
