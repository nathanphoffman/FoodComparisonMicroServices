'use client';

import { useState, useEffect } from 'react';
import { Slider } from '../Inputs/Slider';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';
import type { CustomFoodBasis, CustomFoodInput } from './FoodTableTypes';

// Each ingredient has its own independent slider level; its percentage is its
// share of the total level (same idea as the Compare By / Score Priorities sliders).
type Ingredient = { slug: string; name: string; level: number };

type Saved = { basis: CustomFoodBasis; ingredients: Ingredient[] };

const MAX_LEVEL = 100;
const LEVEL_STEP = 0.5;
const DEFAULT_LEVEL = MAX_LEVEL / 2;

const BASIS_OPTIONS: { value: CustomFoodBasis; label: string }[] = [
    { value: 'calories', label: 'By calories' },
    { value: 'mass',     label: 'By mass' },
];

// ── Percentage math ───────────────────────────────────────────────────────────

/** Each ingredient's percentage of the total level; all 0 if every slider is at 0. */
function toPercents(ingredients: Ingredient[]): number[] {
    const total = ingredients.reduce((sum, ingredient) => sum + ingredient.level, 0);
    return ingredients.map(ingredient => total > 0 ? (ingredient.level / total) * 100 : 0);
}

const formatPercent = (percent: number) => `${Number(percent.toFixed(1))}%`;

// ── Saved state (localStorage) ────────────────────────────────────────────────

function loadSaved(storageKey: string, foods: { slug: string }[]): Saved {
    const empty: Saved = { basis: 'calories', ingredients: [] };
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Saved | null;
        if (!parsed || !Array.isArray(parsed.ingredients)) return empty;
        return {
            basis: parsed.basis === 'mass' ? 'mass' : 'calories',
            // Drop foods that no longer exist.
            ingredients: parsed.ingredients.filter(i => foods.some(f => f.slug === i.slug) && Number.isFinite(i.level)),
        };
    } catch {
        return empty;
    }
}

function save(storageKey: string, value: Saved) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
        // Storage can be full or blocked; the builder still works without it.
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
    slug: string;
    name: string;
    storageKey: string;
    foods: { slug: string; name: string }[];
    onChange: (food: CustomFoodInput) => void;
};

/**
 * Builds a custom food (a meal or a whole diet) from other foods, each given a
 * slider whose share becomes its percentage of calories or of mass. Saved in localStorage, so it survives reloads.
 */
export function CustomFoodBuilder({ slug, name, storageKey, foods, onChange }: Props) {
    const [saved, setSaved]               = useState<Saved>(() => loadSaved(storageKey, foods));
    const [selectedSlug, setSelectedSlug] = useState('');
    const { basis, ingredients } = saved;

    const toInput = ({ basis, ingredients }: Saved): CustomFoodInput => ({
        slug, name, basis,
        ingredients: toPercents(ingredients).map((percent, i) => ({ slug: ingredients[i].slug, fraction: percent / 100 })),
    });

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    // Tell the table about the saved food right away on load.
    useEffect(() => {
        onChange(toInput(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function update(next: Saved) {
        setSaved(next);
        save(storageKey, next);
        debouncedOnChange(toInput(next));
    }

    function add() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        update({ basis, ingredients: [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }] });
        setSelectedSlug('');
    }

    function remove(removedSlug: string) {
        update({ basis, ingredients: ingredients.filter(i => i.slug !== removedSlug) });
    }

    const percents = toPercents(ingredients);

    const available = [...foods]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(f => !ingredients.some(i => i.slug === f.slug));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
                <select
                    value={selectedSlug}
                    onChange={e => setSelectedSlug(e.target.value)}
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white flex-1 min-w-0"
                >
                    <option value="">Select a food…</option>
                    {available.map(f => (
                        <option key={f.slug} value={f.slug}>{f.name}</option>
                    ))}
                </select>
                <button
                    onClick={add}
                    disabled={!selectedSlug}
                    className="px-3 py-1 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 shrink-0"
                >
                    Add
                </button>
                <select
                    value={basis}
                    onChange={e => update({ basis: e.target.value as CustomFoodBasis, ingredients })}
                    aria-label="What the percentages are of"
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white shrink-0"
                >
                    {BASIS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {ingredients.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                    {ingredients.map((ing, idx) => (
                        <div key={ing.slug} className="flex items-center gap-2">
                            <span className="text-xs text-neutral-600 w-20 md:w-28 truncate shrink-0">{ing.name}</span>
                            <span className="text-xs text-neutral-500 w-12 text-right shrink-0">
                                {formatPercent(percents[idx])}
                            </span>
                            <div className="flex-1 min-w-0">
                                <Slider
                                    min={0}
                                    max={MAX_LEVEL}
                                    step={LEVEL_STEP}
                                    value={ing.level}
                                    onChange={v => update({ basis, ingredients: ingredients.map((x, j) => j === idx ? { ...x, level: v } : x) })}
                                />
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                    <span>Least</span>
                                    <span>Most</span>
                                </div>
                            </div>
                            <button
                                onClick={() => remove(ing.slug)}
                                className="text-neutral-400 hover:text-red-500 text-xs shrink-0 leading-none"
                                aria-label={`Remove ${ing.name}`}
                            >✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
