'use client';

import { useState, useEffect } from 'react';
import { Slider } from '../Inputs/Slider';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';
import type { CustomFoodBasis, CustomFoodInput, Micronutrients, MicronutrientKey } from './FoodTableTypes';
import { absorptionMultiplier, DEFAULT_MEALS_PER_DAY, MAX_MEALS_PER_DAY, MIN_MEALS_PER_DAY, ABSORPTION_NUTRIENTS } from './FoodTableAbsorption';
import { MIN_RDA_AGE, type DietSettings, type Sex } from './FoodTableRda';

// Each ingredient has its own independent slider level; its percentage is its
// share of the total level (same idea as the Compare By / Score Priorities sliders).
// `fine` makes that ingredient's slider set its share directly, 0–1% in 0.005% steps.
type Ingredient = { slug: string; name: string; level: number; fine?: boolean };

// calorieTarget is the user's total calories per day, sex and age pick their daily vitamin and mineral needs
// (all null until entered).
type Saved = { basis: CustomFoodBasis; ingredients: Ingredient[]; calorieTarget: number | null; sex: Sex | null; age: number | null; weightLb: number | null; mealsPerDay: number };

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
    const empty: Saved = { basis: 'calories', ingredients: [], calorieTarget: null, sex: null, age: null, weightLb: null, mealsPerDay: DEFAULT_MEALS_PER_DAY };
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Saved | null;
        if (!parsed || !Array.isArray(parsed.ingredients)) return empty;
        return {
            basis: parsed.basis === 'mass' ? 'mass' : 'calories',
            calorieTarget: Number.isFinite(parsed.calorieTarget) && (parsed.calorieTarget ?? 0) > 0 ? parsed.calorieTarget : null,
            sex: parsed.sex === 'male' || parsed.sex === 'female' ? parsed.sex : null,
            age: Number.isFinite(parsed.age) && (parsed.age ?? 0) > 0 ? parsed.age : null,
            mealsPerDay: Number.isFinite(parsed.mealsPerDay) && (parsed.mealsPerDay ?? 0) > 0 ? parsed.mealsPerDay : DEFAULT_MEALS_PER_DAY,
            weightLb: Number.isFinite(parsed.weightLb) && (parsed.weightLb ?? 0) > 0 ? parsed.weightLb : null,
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
    foods: { slug: string; name: string; calories?: number; micronutrients?: Micronutrients | null }[];
    /** Shows a total calories / day field and each food's calories per day and week. */
    showCalories?: boolean;
    /** Opens the diet's nutrition breakdown; the "Show Diet" button is greyed out until a food is added. */
    onShow?: () => void;
    /** Reports the daily calories, sex and age once typing settles (and once on load). */
    onSettingsChange?: (settings: DietSettings) => void;
    onChange: (food: CustomFoodInput) => void;
};

/**
 * Builds a custom food (a meal or a whole diet) from other foods, each given a
 * slider whose share becomes its percentage of calories or of mass. Saved in localStorage, so it survives reloads.
 */
export function CustomFoodBuilder({ slug, name, storageKey, foods, showCalories, onShow, onSettingsChange, onChange }: Props) {
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
    // The share of each absorption-limited nutrient that still counts, from each food's daily amount and meals per day.
    function settingsOf(state: Saved): DietSettings {
        const base = { calories: state.calorieTarget, sex: state.sex, age: state.age, weightLb: state.weightLb };
        if (!state.calorieTarget) return base;
        const shares = toPercents(state.ingredients);
        const weights = state.ingredients.map((ing, i) => state.basis === 'calories' ? shares[i] : shares[i] * (foods.find(f => f.slug === ing.slug)?.calories ?? 0));
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        if (total <= 0) return base;
        const all: Partial<Record<MicronutrientKey, number>> = {};
        const counted: Partial<Record<MicronutrientKey, number>> = {};
        state.ingredients.forEach((ing, i) => {
            const food = foods.find(f => f.slug === ing.slug);
            if (!food?.calories || !food.micronutrients) return;
            const grams = (weights[i] / total) * state.calorieTarget! / food.calories;
            for (const key of ABSORPTION_NUTRIENTS) {
                const daily = (food.micronutrients[key] ?? 0) * grams;
                all[key] = (all[key] ?? 0) + daily;
                counted[key] = (counted[key] ?? 0) + daily * absorptionMultiplier(key, daily, state.mealsPerDay);
            }
        });
        const absorption: Partial<Record<MicronutrientKey, number>> = {};
        for (const key of ABSORPTION_NUTRIENTS) if ((all[key] ?? 0) > 0) absorption[key] = counted[key]! / all[key]!;
        return { ...base, absorption };
    }

    const debouncedSettings = useDebouncedCallback((next: Saved) => onSettingsChange?.(settingsOf(next)), DEBOUNCE_MS);
    const debouncedSettle    = useDebouncedCallback((next: Saved) => {
        setSettled(next);
        setActiveSlug(null);
    }, DEBOUNCE_MS);

    // Tell the table about the saved food right away on load.
    useEffect(() => {
        onChange(toInput(saved));
        onSettingsChange?.(settingsOf(saved));
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
        debouncedSettings(next);
    }

    // How many meals a day the foods are spread over; only the whole-diet tooltip numbers change, so no rescoring.
    function setMeals(mealsPerDay: number) {
        const next = { ...saved, mealsPerDay };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function setSex(value: string) {
        const next = { ...saved, sex: value === 'male' || value === 'female' ? value : null } as Saved;
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function setWeight(value: string) {
        const weight = Number(value);
        const next = { ...saved, weightLb: value !== '' && Number.isFinite(weight) && weight > 0 ? weight : null };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function setAge(value: string) {
        const age = Number(value);
        const next = { ...saved, age: value !== '' && Number.isFinite(age) && age > 0 ? Math.round(age) : null };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
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
            {showCalories && onShow && (
                <button
                    onClick={onShow}
                    disabled={ingredients.length === 0}
                    className="self-start px-3 py-1 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                    Show Diet
                </button>
            )}
            {showCalories && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
                    <label className="flex items-center gap-2">
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
                    <label className="flex items-center gap-2">
                        Sex
                        <select
                            value={saved.sex ?? ''}
                            onChange={e => setSex(e.target.value)}
                            className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white"
                        >
                            <option value="">Not set</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2" title={`Adjusts your daily needs by age (${MIN_RDA_AGE} or older)`}>
                        Age
                        <input
                            type="number"
                            min={MIN_RDA_AGE}
                            max={120}
                            inputMode="numeric"
                            value={saved.age ?? ''}
                            onChange={e => setAge(e.target.value)}
                            className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white w-16"
                        />
                    </label>
                    <label className="flex items-center gap-2" title="Scales your vitamin and mineral needs (about weight^0.75) and sets your protein need (0.8 g per kg)">
                        Weight (lb)
                        <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={saved.weightLb ?? ''}
                            onChange={e => setWeight(e.target.value)}
                            className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white w-20"
                        />
                    </label>
                </div>
            )}
            {showCalories && (
                <div className="flex items-center gap-3 text-sm text-neutral-700" title="Meals a day you're guaranteed to eat the foods on this list. Fewer meals puts more of the B12, calcium and vitamin C into a single meal than your body can absorb, which lowers the whole-diet % daily need.">
                    <span className="shrink-0">Meals / day: {saved.mealsPerDay.toFixed(1)}</span>
                    <div className="flex-1 min-w-0">
                        <Slider min={MIN_MEALS_PER_DAY} max={MAX_MEALS_PER_DAY} step={0.1} value={saved.mealsPerDay} onChange={setMeals} />
                    </div>
                </div>
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
