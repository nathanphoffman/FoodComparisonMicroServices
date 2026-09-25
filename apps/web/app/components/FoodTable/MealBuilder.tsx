'use client';

import { useState } from 'react';
import { Slider } from '../Inputs/Slider';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';
import { DEFAULT_LEVEL, MAX_LEVEL, toShares } from './Sliders/PercentSliders';

export type MealIngredient = { slug: string; fraction: number };

// Each ingredient has an independent "least to most" level; the meal fraction
// is its share of the total level (same math as Compare By / Score Priorities).
type Ingredient = { slug: string; name: string; level: number };

function toFractions(ingredients: Ingredient[]): Record<string, number> {
    const shares = toShares(Object.fromEntries(ingredients.map(i => [i.slug, i.level])));
    return Object.fromEntries(Object.entries(shares).map(([slug, pct]) => [slug, pct / 100]));
}

type Props = {
    foods: { slug: string; name: string }[];
    onChange: (ingredients: MealIngredient[]) => void;
};

export function MealBuilder({ foods, onChange }: Props) {
    const [selectedSlug, setSelectedSlug]     = useState('');
    const [ingredients, setIngredients]       = useState<Ingredient[]>([]);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    function emit(next: Ingredient[]) {
        const fractions = toFractions(next);
        debouncedOnChange(next.map(({ slug }) => ({ slug, fraction: fractions[slug] })));
    }

    function add() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        const next: Ingredient[] = [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }];
        setIngredients(next);
        emit(next);
        setSelectedSlug('');
    }

    function remove(slug: string) {
        const next = ingredients.filter(i => i.slug !== slug);
        setIngredients(next);
        emit(next);
    }

    function handleSliderChange(index: number, level: number) {
        const next = ingredients.map((ing, j) => j === index ? { ...ing, level } : ing);
        setIngredients(next);
        emit(next);
    }

    const fractions = toFractions(ingredients);

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
            </div>

            {ingredients.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                    {ingredients.map((ing, idx) => (
                        <div key={ing.slug} className="flex items-start gap-2">
                            <span className="text-xs text-neutral-600 w-20 md:w-28 truncate shrink-0">{ing.name}</span>
                            <span className="text-xs text-neutral-500 w-8 text-right shrink-0">
                                {Math.round(fractions[ing.slug] * 100)}%
                            </span>
                            <div className="flex-1 min-w-0">
                                <Slider
                                    min={0}
                                    max={MAX_LEVEL}
                                    step={1}
                                    value={ing.level}
                                    onChange={v => handleSliderChange(idx, v)}
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
