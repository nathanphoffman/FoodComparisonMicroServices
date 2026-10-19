import { useState } from 'react';
import { Slider } from '../../Inputs/Slider';
import { MICRONUTRIENT_INFO } from '../FoodTableCalculations';
import { MICRONUTRIENT_KEYS, type MicronutrientKey } from '../FoodTableTypes';
import { dailyNeeds, type NutrientStandard } from '../FoodTableRda';
import { positiveOrZero, SupplementRow } from './SupplementRow';
import type { Saved, Supplement } from './CustomFoodSaved';

// What the multivitamin button adds: the vitamins only, not minerals or omega-3.
const VITAMIN_KEYS: MicronutrientKey[] = ['vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'folate', 'vitamin_b12', 'vitamin_b6'];

const INPUT = 'border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white';

type Props = {
    saved: Saved;
    /** Whose recommended intakes a supplement's % RDA is measured against. */
    standard: NutrientStandard;
    onChange: (patch: Partial<Saved>) => void;
};

/** Adds, edits and removes the vitamins and minerals taken as pills, and sets how much of each pill is absorbed. */
export function SupplementEditor({ saved, standard, onChange }: Props) {
    // The multivitamin shortcut's inputs; it adds one supplement per vitamin at this % of your daily need.
    const [multiPercent, setMultiPercent] = useState(100);
    const [multiPerWeek, setMultiPerWeek] = useState(7);
    const needs = dailyNeeds(standard, saved.sex, saved.age, saved.weightLb);
    const setSupplements = (supplements: Supplement[]) => onChange({ supplements });

    function addMultivitamin() {
        if (!(multiPercent > 0) || !(multiPerWeek > 0)) return;
        setSupplements([
            ...saved.supplements,
            ...VITAMIN_KEYS.map(key => ({ key, dose: needs[key] * multiPercent / 100, perWeek: multiPerWeek, percent: true })),
        ]);
    }

    return (
        <div className="flex flex-col gap-1.5 text-sm text-neutral-700">
            <div className="flex flex-wrap items-center gap-2">
                <span>Vitamins & supplements</span>
                <select
                    value=""
                    onChange={e => {
                        const key = e.target.value as MicronutrientKey;
                        if (key) setSupplements([...saved.supplements, { key, dose: MICRONUTRIENT_INFO[key].dailyValue, perWeek: 7 }]);
                    }}
                    aria-label="Add a vitamin or mineral"
                    className={INPUT}
                >
                    <option value="">Add a vitamin…</option>
                    {MICRONUTRIENT_KEYS.map(key => (
                        <option key={key} value={key}>{MICRONUTRIENT_INFO[key].label}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs" title="Adds every vitamin (A, C, D, E, K, folate, B12, B6) as its own line at this % of your daily need, which you can then adjust or remove one by one. Minerals and omega-3 aren't included.">
                <span className="text-sm">Multivitamin: all vitamins at</span>
                <input
                    type="number" min={0} step="any" inputMode="decimal"
                    value={multiPercent || ''}
                    onChange={e => setMultiPercent(positiveOrZero(e.target.value))}
                    aria-label="Multivitamin percent of RDA"
                    className={`${INPUT} text-xs w-16`}
                />
                <span>% RDA ×</span>
                <input
                    type="number" min={0} step="any" inputMode="decimal"
                    value={multiPerWeek || ''}
                    onChange={e => setMultiPerWeek(positiveOrZero(e.target.value))}
                    aria-label="Multivitamin pills per week"
                    className={`${INPUT} text-xs w-16`}
                />
                <span>per week</span>
                <button
                    onClick={addMultivitamin}
                    disabled={!(multiPercent > 0) || !(multiPerWeek > 0)}
                    className="px-3 py-1 text-xs rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Add
                </button>
            </div>
            <div className="flex items-center gap-3" title="The share of each pill's dose your body absorbs. Applied to every supplement, on top of the per-sitting limit for B12, calcium and vitamin C.">
                <span className="shrink-0 w-64">Pill absorption: {saved.pillAbsorption}%</span>
                <div className="flex-1 min-w-0">
                    <Slider min={0} max={100} step={5} value={saved.pillAbsorption} onChange={pillAbsorption => onChange({ pillAbsorption })} />
                </div>
            </div>
            {saved.supplements.map((supplement, i) => (
                <SupplementRow
                    key={i}
                    supplement={supplement}
                    dailyNeed={needs[supplement.key]}
                    onChange={patch => setSupplements(saved.supplements.map((s, j) => j === i ? { ...s, ...patch } : s))}
                    onRemove={() => setSupplements(saved.supplements.filter((_, j) => j !== i))}
                />
            ))}
        </div>
    );
}
