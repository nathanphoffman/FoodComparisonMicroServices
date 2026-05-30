import { useState } from 'react';
import type { RawFood } from '@/lib/queries/commonFoods';
import type { SentientHarmDetail, EmissionsBreakdown, LandUseDetail, WaterDetail } from './FoodTableTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortKey =
    | 'name'
    | 'nutritionScore'
    | 'emissions'
    | 'landUse'
    | 'directKill'
    | 'water'
    | 'sentientHarm'
    | 'finalScore';

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
    sentient_harm:   number | null;
    final_score:     number | null;

    // Tooltip breakdown details (camelCase, matching Rust serde rename_all)
    emissions_breakdown?:  EmissionsBreakdown;
    water_detail:          WaterDetail;
    land_use_detail:       LandUseDetail;
    sentient_harm_detail:  SentientHarmDetail;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Encapsulates all sort state and logic for the FoodTable.
 *
 * Returns:
 *  - `columnSortProps(key)` — convenience props to spread onto a column header
 *  - `sortRows(foods, scored)` — returns the sorted RawFood array
 */
export function useFoodTableSort() {
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function columnSortProps(key: SortKey) {
        return { sorted: sortKey === key ? sortDir : undefined, onSort: () => handleSort(key) };
    }

    function sortRows(foods: RawFood[], scored: Map<string, ScoredRow>): RawFood[] {
        if (!sortKey) return foods;

        return [...foods].sort((a, b) => {
            const sa = scored.get(a.slug);
            const sb = scored.get(b.slug);

            let va: number | string | null = null;
            let vb: number | string | null = null;

            if (sortKey === 'name') {
                va = a.name; vb = b.name;
            } else if (sortKey === 'nutritionScore') {
                va = sa?.nutrition_score ?? null;
                vb = sb?.nutrition_score ?? null;
            } else if (sa && sb) {
                va = sortKey === 'emissions'      ? sa.emissions
                   : sortKey === 'landUse'        ? sa.land_use
                   : sortKey === 'directKill'     ? sa.direct_kill
                   : sortKey === 'water'          ? sa.water
                   : sortKey === 'sentientHarm' ? sa.sentient_harm
                   : sortKey === 'finalScore'     ? sa.final_score
                   : null;
                vb = sortKey === 'emissions'      ? sb.emissions
                   : sortKey === 'landUse'        ? sb.land_use
                   : sortKey === 'directKill'     ? sb.direct_kill
                   : sortKey === 'water'          ? sb.water
                   : sortKey === 'sentientHarm' ? sb.sentient_harm
                   : sortKey === 'finalScore'     ? sb.final_score
                   : null;
            }

            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            if (va === vb) return 0;
            const cmp = va < vb ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }

    return { sortKey, sortDir, handleSort, columnSortProps, sortRows };
}
