import { useState } from 'react';
import type { MicronutrientKey } from '../../../types/FoodTableTypes';
import { positiveOrZero } from './SupplementRow';
import { DEFAULT_PILLS_PER_WEEK, type Supplement } from '../logic/DietSaved';

// What the multivitamin button adds: the vitamins only, not minerals or omega-3.
const VITAMIN_KEYS: MicronutrientKey[] = ['vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'folate', 'vitamin_b12', 'vitamin_b6'];

const DEFAULT_PERCENT_OF_DAILY_NEED = 100;

const BOX = 'border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white w-16';
const HELP = "Adds every vitamin (A, C, D, E, K, folate, B12, B6) as its own line at this % of your daily need, which you can then adjust or remove one by one. Minerals and omega-3 aren't included.";

/** One-click multivitamin: adds a supplement line per vitamin at a chosen % of your daily need. */
export function MultivitaminForm({ dailyNeeds, onAdd }: { dailyNeeds: Record<MicronutrientKey, number>; onAdd: (supplements: Supplement[]) => void }) {
    const [percent, setPercent] = useState(DEFAULT_PERCENT_OF_DAILY_NEED);
    const [perWeek, setPerWeek] = useState(DEFAULT_PILLS_PER_WEEK);
    const canAdd = percent > 0 && perWeek > 0;

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs" title={HELP}>
            <span className="text-sm">Multivitamin: all vitamins at</span>
            <input type="number" min={0} step="any" inputMode="decimal" value={percent || ''} className={BOX}
                onChange={e => setPercent(positiveOrZero(e.target.value))} aria-label="Multivitamin percent of RDA" />
            <span>% RDA ×</span>
            <input type="number" min={0} step="any" inputMode="decimal" value={perWeek || ''} className={BOX}
                onChange={e => setPerWeek(positiveOrZero(e.target.value))} aria-label="Multivitamin pills per week" />
            <span>per week</span>
            <button
                onClick={() => onAdd(VITAMIN_KEYS.map(key => ({ key, dose: dailyNeeds[key] * percent / 100, perWeek, percent: true })))}
                disabled={!canAdd}
                className="px-3 py-1 text-xs rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Add
            </button>
        </div>
    );
}
