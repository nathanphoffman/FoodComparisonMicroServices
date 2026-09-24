import { useState } from 'react';
import type { RawFood } from '@/lib/queries/commonFoods';
import type { SentientHarmDetail, EmissionsBreakdown, LandUseDetail, WaterDetail, KillDetail } from './FoodTableTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortKey =
    | 'name'
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
    const [sortKey, setSortKey] = useState<SortKey | null>('finalScore');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const HIGHER_IS_BETTER: SortKey[] = ['finalScore', 'nutritionScore', 'availability'];

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir(HIGHER_IS_BETTER.includes(key) ? 'desc' : 'asc'); }
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
                   : sortKey === 'captiveSentience' ? sa.captive_sentience
                   : sortKey === 'water'          ? sa.water
                   : sortKey === 'sentientHarm'   ? sa.sentient_harm
                   : sortKey === 'finalScore'     ? sa.final_score
                   : sortKey === 'availability'   ? sa.availability
                   : null;
                vb = sortKey === 'emissions'      ? sb.emissions
                   : sortKey === 'landUse'        ? sb.land_use
                   : sortKey === 'directKill'     ? sb.direct_kill
                   : sortKey === 'captiveSentience' ? sb.captive_sentience
                   : sortKey === 'water'          ? sb.water
                   : sortKey === 'sentientHarm'   ? sb.sentient_harm
                   : sortKey === 'finalScore'     ? sb.final_score
                   : sortKey === 'availability'   ? sb.availability
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
