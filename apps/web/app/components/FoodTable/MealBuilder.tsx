'use client';

import { useState } from 'react';
import { Slider } from '../Inputs/Slider';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';

export type MealIngredient = { slug: string; fraction: number };

type Ingredient = { slug: string; name: string; fraction: number };

type Props = {
    foods: { slug: string; name: string }[];
    onChange: (ingredients: MealIngredient[]) => void;
};

export function MealBuilder({ foods, onChange }: Props) {
    const [selectedSlug, setSelectedSlug]     = useState('');
    const [ingredients, setIngredients]       = useState<Ingredient[]>([]);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    function emit(next: Ingredient[]) {
        debouncedOnChange(next.map(({ slug, fraction }) => ({ slug, fraction })));
    }

    function add() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        const count = ingredients.length + 1;
        const fraction = 1 / count;
        const next: Ingredient[] = [
            ...ingredients.map(i => ({ ...i, fraction })),
            { slug: food.slug, name: food.name, fraction },
        ];
        setIngredients(next);
        emit(next);
        setSelectedSlug('');
    }

    function remove(slug: string) {
        const remaining = ingredients.filter(i => i.slug !== slug);
        const next = remaining.length === 0
            ? []
            : remaining.map(i => ({ ...i, fraction: 1 / remaining.length }));
        setIngredients(next);
        emit(next);
    }

    function handleSliderChange(index: number, newPct: number) {
        const newFraction = Math.min(newPct / 100, 1.0);
        const others = ingredients.filter((_, j) => j !== index);
        const othersTotal = others.reduce((s, i) => s + i.fraction, 0);
        const remaining = 1.0 - newFraction;

        const next = ingredients.map((ing, j) => {
            if (j === index) return { ...ing, fraction: newFraction };
            const scale = othersTotal > 0 ? ing.fraction / othersTotal : 1 / others.length;
            return { ...ing, fraction: remaining * scale };
        });
        setIngredients(next);
        emit(next);
    }

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
                        <div key={ing.slug} className="flex items-center gap-2">
                            <span className="text-xs text-neutral-600 w-28 truncate shrink-0">{ing.name}</span>
                            <span className="text-xs text-neutral-500 w-8 text-right shrink-0">
                                {Math.round(ing.fraction * 100)}%
                            </span>
                            <div className="flex-1 min-w-0">
                                <Slider
                                    min={0}
                                    max={100}
                                    value={Math.round(ing.fraction * 100)}
                                    onChange={v => handleSliderChange(idx, v)}
                                />
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
