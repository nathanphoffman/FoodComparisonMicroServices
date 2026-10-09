'use client';

import { useState, useEffect } from 'react';
import { Slider } from '../Inputs/Slider';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';
import type { CustomFoodBasis, CustomFoodInput } from './FoodTableTypes';

// Each ingredient has its own independent slider level; its percentage is its
// share of the total level (same idea as the Compare By / Score Priorities sliders).
// `fine` makes that ingredient's slider set its share directly, 0–1% in 0.005% steps.
type Ingredient = { slug: string; name: string; level: number; fine?: boolean };

// calorieTarget is the user's total calories per day (null until they type one in).
type Saved = { basis: CustomFoodBasis; ingredients: Ingredient[]; calorieTarget: number | null };

const DAYS_PER_WEEK = 7;

const MAX_LEVEL = 100;
const LEVEL_STEP = 0.5;
const DEFAULT_LEVEL = MAX_LEVEL / 2;
const FINE_MAX_PERCENT = 1;
const FINE_STEP_PERCENT = 0.005;

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

// Small shares need three decimals now that fine control moves them in 0.005% steps.
const formatPercent = (percent: number) => `${Number(percent.toFixed(percent < 1 ? 3 : 1))}%`;

// ── Saved state (localStorage) ────────────────────────────────────────────────

function loadSaved(storageKey: string, foods: { slug: string }[]): Saved {
    const empty: Saved = { basis: 'calories', ingredients: [], calorieTarget: null };
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Saved | null;
        if (!parsed || !Array.isArray(parsed.ingredients)) return empty;
        return {
            basis: parsed.basis === 'mass' ? 'mass' : 'calories',
            calorieTarget: Number.isFinite(parsed.calorieTarget) && (parsed.calorieTarget ?? 0) > 0 ? parsed.calorieTarget : null,
            // Drop foods that no longer exist.
            ingredients: parsed.ingredients
                .filter(i => foods.some(f => f.slug === i.slug) && Number.isFinite(i.level))
                .map(i => ({ ...i, fine: !!i.fine })),
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
    foods: { slug: string; name: string; calories?: number }[];
    /** Shows a total calories / day field and each food's calories per day and week. */
    showCalories?: boolean;
    /** Reports the daily calories once typing settles (and once on load). */
    onCalorieTargetChange?: (calories: number | null) => void;
    onChange: (food: CustomFoodInput) => void;
};

/**
 * Builds a custom food (a meal or a whole diet) from other foods, each given a
 * slider whose share becomes its percentage of calories or of mass. Saved in localStorage, so it survives reloads.
 */
export function CustomFoodBuilder({ slug, name, storageKey, foods, showCalories, onCalorieTargetChange, onChange }: Props) {
    const [saved, setSaved]               = useState<Saved>(() => loadSaved(storageKey, foods));
    const [selectedSlug, setSelectedSlug] = useState('');
    // The calorie lines follow this delayed copy, so they update with the table instead of on every slider move.
    // The slider being dragged (activeSlug) is the exception: its own line follows the live state.
    const [settled, setSettled]       = useState<Saved>(saved);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const { basis, ingredients } = saved;

    const toInput = ({ basis, ingredients }: Saved): CustomFoodInput => ({
        slug, name, basis,
        ingredients: toPercents(ingredients).map((percent, i) => ({ slug: ingredients[i].slug, fraction: percent / 100 })),
    });

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);
    const debouncedCalorieTarget = useDebouncedCallback((calories: number | null) => onCalorieTargetChange?.(calories), DEBOUNCE_MS);
    const debouncedSettle    = useDebouncedCallback((next: Saved) => {
        setSettled(next);
        setActiveSlug(null);
    }, DEBOUNCE_MS);

    // Tell the table about the saved food right away on load.
    useEffect(() => {
        onChange(toInput(saved));
        onCalorieTargetChange?.(saved.calorieTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function update(patch: Pick<Saved, 'basis' | 'ingredients'>) {
        const next = { ...saved, ...patch };
        setSaved(next);
        save(storageKey, next);
        debouncedOnChange(toInput(next));
        debouncedSettle(next);
    }

    // Only the daily total changed, so there's nothing to rescore.
    function setCalorieTarget(value: string) {
        const calories = Number(value);
        const next = { ...saved, calorieTarget: value !== '' && Number.isFinite(calories) && calories > 0 ? calories : null };
        setSaved(next);
        save(storageKey, next);
        debouncedSettle(next);
        debouncedCalorieTarget(next.calorieTarget);
    }

    function add() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        update({ basis, ingredients: [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }] });
        setSelectedSlug('');
    }

    const percents = toPercents(ingredients);

    // Each ingredient's share of the day's calories. By calories that's its percentage; by mass it's
    // its grams times its calories per gram, as a share of the total.
    const caloriesPerGram = (ingSlug: string) => foods.find(f => f.slug === ingSlug)?.calories ?? 0;
    const caloriesPerDayIn = (state: Saved, ingSlug: string): number | null => {
        const index = state.ingredients.findIndex(i => i.slug === ingSlug);
        if (!state.calorieTarget || index < 0) return null;
        const stateShares = toPercents(state.ingredients);
        const weights = state.ingredients.map((ing, i) => state.basis === 'calories' ? stateShares[i] : stateShares[i] * caloriesPerGram(ing.slug));
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        return total > 0 ? (weights[index] / total) * state.calorieTarget : null;
    };
    // The item being adjusted updates live; every other item waits for the debounce.
    const caloriesPerDay = (ingSlug: string) => caloriesPerDayIn(ingSlug === activeSlug ? saved : settled, ingSlug);
    const formatCalories = (kcal: number) => Math.round(kcal).toLocaleString();

    // Fine slider edits this ingredient's share directly (0–1%), so the level is worked out from the other ingredients.
    function levelForPercent(index: number, percent: number): number {
        const others = ingredients.reduce((sum, ing, j) => j === index ? sum : sum + ing.level, 0);
        return others > 0 ? (percent / (100 - percent)) * others : ingredients[index].level;
    }

    function setFine(index: number, fine: boolean) {
        update({
            basis,
            ingredients: ingredients.map((ing, j) => j !== index ? ing : {
                ...ing, fine,
                level: fine && percents[index] > FINE_MAX_PERCENT ? levelForPercent(index, FINE_MAX_PERCENT) : ing.level,
            }),
        });
    }

    function remove(removedSlug: string) {
        update({ basis, ingredients: ingredients.filter(i => i.slug !== removedSlug) });
    }

    const available = [...foods]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(f => !ingredients.some(i => i.slug === f.slug));

    return (
        <div className="flex flex-col gap-2">
            {showCalories && (
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                    Total calories / day
                    <input
                        type="number"
                        min={0}
                        step={50}
                        inputMode="numeric"
                        value={saved.calorieTarget ?? ''}
                        onChange={e => setCalorieTarget(e.target.value)}
                        placeholder="2000"
                        className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white w-24"
                    />
                </label>
            )}
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
                        <div key={ing.slug}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-600 w-20 md:w-28 truncate shrink-0">{ing.name}</span>
                            <span className="text-xs text-neutral-500 w-12 text-right shrink-0">
                                {formatPercent(percents[idx])}
                            </span>
                            <div className="flex-1 min-w-0">
                                <Slider
                                    min={0}
                                    max={ing.fine ? FINE_MAX_PERCENT : MAX_LEVEL}
                                    step={ing.fine ? FINE_STEP_PERCENT : LEVEL_STEP}
                                    value={ing.fine ? Math.min(percents[idx], FINE_MAX_PERCENT) : ing.level}
                                    onChange={v => {
                                        setActiveSlug(ing.slug);
                                        update({ basis, ingredients: ingredients.map((x, j) => j === idx ? { ...x, level: ing.fine ? levelForPercent(idx, v) : v } : x) });
                                    }}
                                />
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                    <span>Least</span>
                                    <span>{ing.fine ? `${FINE_MAX_PERCENT}%` : 'Most'}</span>
                                </div>
                            </div>
                            <label className="flex items-center gap-1 text-[10px] text-neutral-500 shrink-0 cursor-pointer" title="Fine control: the slider sets this food's share directly from 0 to 1% in 0.005% steps">
                                <input type="checkbox" checked={!!ing.fine} onChange={e => setFine(idx, e.target.checked)} />
                                ÷100
                            </label>
                            <button
                                onClick={() => remove(ing.slug)}
                                className="text-neutral-400 hover:text-red-500 text-xs shrink-0 leading-none"
                                aria-label={`Remove ${ing.name}`}
                            >✕</button>
                        </div>
                        {showCalories && caloriesPerDay(ing.slug) !== null && (
                            <p className="text-[10px] text-neutral-500 pl-[5.5rem] md:pl-[8rem]">
                                {formatCalories(caloriesPerDay(ing.slug)!)} kcal / day · {formatCalories(caloriesPerDay(ing.slug)! * DAYS_PER_WEEK)} kcal / week
                            </p>
                        )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
