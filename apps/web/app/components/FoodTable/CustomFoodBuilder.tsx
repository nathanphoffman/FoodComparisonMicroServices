'use client';

import { useState, useEffect } from 'react';
import { Slider } from '../Inputs/Slider';
import { MICRONUTRIENT_INFO } from './FoodTableCalculations';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../hooks/useDebouncedCallback';
import { MICRONUTRIENT_KEYS, type CustomFoodBasis, type CustomFoodInput, type Micronutrients, type MicronutrientKey } from './FoodTableTypes';
import { absorptionMultiplier, absorbedFromDose, mealsPerDayFor, DEFAULT_DAYS_BETWEEN, MAX_DAYS_BETWEEN, MIN_DAYS_BETWEEN, ABSORPTION_NUTRIENTS } from './FoodTableAbsorption';
import { ACTIVITY_LEVELS, DEFAULT_ACTIVITY } from './FoodTableTargets';
import { MIN_RDA_AGE, dailyNeeds, DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard, type Sex } from './FoodTableRda';

// Each ingredient has its own independent slider level; its percentage is its
// share of the total level (same idea as the Compare By / Score Priorities sliders).
// `fine` makes that ingredient's slider set its share directly, 0–1% in 0.005% steps.
type Ingredient = { slug: string; name: string; level: number; fine?: boolean };

// calorieTarget is the user's total calories per day, sex and age pick their daily vitamin and mineral needs
// (all null until entered).
// A supplement: `dose` per pill in the nutrient's own unit, taken `perWeek` times a week.
// `percent` only changes how the dose is entered and shown (as % of your daily need); `dose` is always in the nutrient's unit.
type Supplement = { key: MicronutrientKey; dose: number; perWeek: number; percent?: boolean };
type Saved = { supplements: Supplement[]; pillAbsorption: number; basis: CustomFoodBasis; ingredients: Ingredient[]; calorieTarget: number | null; sex: Sex | null; age: number | null; weightLb: number | null; daysBetween: number; activity: number };

const DAYS_PER_WEEK = 7;

// Share of a pill's dose that counts, on top of the per-sitting limit for B12, calcium and vitamin C.
const DEFAULT_PILL_ABSORPTION = 75;

// What the multivitamin button adds: the vitamins only, not minerals or omega-3.
const VITAMIN_KEYS: MicronutrientKey[] = ['vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'folate', 'vitamin_b12', 'vitamin_b6'];

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
    const empty: Saved = { supplements: [], pillAbsorption: DEFAULT_PILL_ABSORPTION, basis: 'calories', ingredients: [], calorieTarget: null, sex: null, age: null, weightLb: null, daysBetween: DEFAULT_DAYS_BETWEEN, activity: DEFAULT_ACTIVITY };
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Saved | null;
        if (!parsed || !Array.isArray(parsed.ingredients)) return empty;
        return {
            basis: parsed.basis === 'mass' ? 'mass' : 'calories',
            calorieTarget: Number.isFinite(parsed.calorieTarget) && (parsed.calorieTarget ?? 0) > 0 ? parsed.calorieTarget : null,
            sex: parsed.sex === 'male' || parsed.sex === 'female' ? parsed.sex : null,
            age: Number.isFinite(parsed.age) && (parsed.age ?? 0) > 0 ? parsed.age : null,
            activity: Number.isInteger(parsed.activity) && parsed.activity >= 0 && parsed.activity < ACTIVITY_LEVELS.length ? parsed.activity : DEFAULT_ACTIVITY,
            daysBetween: Number.isFinite(parsed.daysBetween) && (parsed.daysBetween ?? 0) > 0 ? parsed.daysBetween : DEFAULT_DAYS_BETWEEN,
            weightLb: Number.isFinite(parsed.weightLb) && (parsed.weightLb ?? 0) > 0 ? parsed.weightLb : null,
            pillAbsorption: Number.isFinite(parsed.pillAbsorption) && parsed.pillAbsorption >= 0 && parsed.pillAbsorption <= 100 ? parsed.pillAbsorption : DEFAULT_PILL_ABSORPTION,
            supplements: Array.isArray(parsed.supplements)
                ? parsed.supplements.filter(s => MICRONUTRIENT_KEYS.includes(s?.key) && s.dose > 0 && s.perWeek > 0)
                    .map(s => ({ ...s, percent: !!s.percent }))
                : [],
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
    /** Whose recommended intakes a supplement's % RDA is measured against. */
    standard?: NutrientStandard;
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
export function CustomFoodBuilder({ slug, name, storageKey, foods, standard = DEFAULT_NUTRIENT_STANDARD, showCalories, onShow, onSettingsChange, onChange }: Props) {
    const [saved, setSaved]               = useState<Saved>(() => loadSaved(storageKey, foods));
    const [selectedSlug, setSelectedSlug] = useState('');
    // The multivitamin shortcut's inputs; it adds one supplement per vitamin at this % of your daily need.
    const [multiPercent, setMultiPercent] = useState(100);
    const [multiPerWeek, setMultiPerWeek] = useState(7);
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
        // Each pill is one sitting, so its absorbed amount is capped for B12, calcium and vitamin C; spread over the week.
        const supplements: Partial<Record<MicronutrientKey, number>> = {};
        for (const { key, dose, perWeek } of state.supplements) {
            supplements[key] = (supplements[key] ?? 0) + absorbedFromDose(key, dose) * (state.pillAbsorption / 100) * perWeek / DAYS_PER_WEEK;
        }
        const base = { calories: state.calorieTarget, sex: state.sex, age: state.age, weightLb: state.weightLb, activity: state.activity, supplements };
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
                counted[key] = (counted[key] ?? 0) + daily * absorptionMultiplier(key, daily, mealsPerDayFor(state.daysBetween));
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

    // Longest gap between eating a food on the list; only the whole-diet tooltip numbers change, so no rescoring.
    function setDaysBetween(daysBetween: number) {
        const next = { ...saved, daysBetween };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function addMultivitamin() {
        if (!(multiPercent > 0) || !(multiPerWeek > 0)) return;
        const needs = dailyNeeds(standard, saved.sex, saved.age, saved.weightLb);
        setSupplements([
            ...saved.supplements,
            ...VITAMIN_KEYS.map(key => ({ key, dose: needs[key] * multiPercent / 100, perWeek: multiPerWeek, percent: true })),
        ]);
    }

    function setPillAbsorption(pillAbsorption: number) {
        const next = { ...saved, pillAbsorption };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function setSupplements(supplements: Supplement[]) {
        const next = { ...saved, supplements };
        setSaved(next);
        save(storageKey, next);
        debouncedSettings(next);
    }

    function setActivity(activity: number) {
        const next = { ...saved, activity };
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
                <div className="flex items-center gap-3 text-sm text-neutral-700" title="The longest you go without eating a food on this list. The longer the gap, the more of its B12, calcium and vitamin C arrives in one meal, beyond what your body can absorb at once, which lowers the whole-diet % daily need. 0.1 days is 10 meals a day.">
                    <span className="shrink-0 w-64">
                        Longest gap without eating a food on this list: {saved.daysBetween.toFixed(1)} {saved.daysBetween === 1 ? 'day' : 'days'}
                        <span className="text-xs text-neutral-500"> (≈{mealsPerDayFor(saved.daysBetween).toFixed(1)} meals / day)</span>
                    </span>
                    <div className="flex-1 min-w-0">
                        <Slider min={MIN_DAYS_BETWEEN} max={MAX_DAYS_BETWEEN} step={0.1} value={saved.daysBetween} onChange={setDaysBetween} />
                    </div>
                </div>
            )}
            {showCalories && (
                <div className="flex items-center gap-3 text-sm text-neutral-700" title="Sets a protein floor per kg of body weight (needs your weight): modest exercise 1.0, moderately-heavy exercise 1.1, heavy exercise 1.2, athlete 1.6, extreme athlete 2.0 g/kg, from sports-nutrition position statements. General uses the standard's own value, which is for ordinary everyday life.">
                    <span className="shrink-0 w-64">Activity level: {ACTIVITY_LEVELS[saved.activity].label}</span>
                    <div className="flex-1 min-w-0">
                        <Slider min={0} max={ACTIVITY_LEVELS.length - 1} step={1} value={saved.activity} onChange={setActivity} />
                    </div>
                </div>
            )}
            {showCalories && (
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
                            className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white"
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
                            onChange={e => setMultiPercent(Number(e.target.value) > 0 ? Number(e.target.value) : 0)}
                            aria-label="Multivitamin percent of RDA"
                            className="border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white w-16"
                        />
                        <span>% RDA ×</span>
                        <input
                            type="number" min={0} step="any" inputMode="decimal"
                            value={multiPerWeek || ''}
                            onChange={e => setMultiPerWeek(Number(e.target.value) > 0 ? Number(e.target.value) : 0)}
                            aria-label="Multivitamin pills per week"
                            className="border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white w-16"
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
                            <Slider min={0} max={100} step={5} value={saved.pillAbsorption} onChange={setPillAbsorption} />
                        </div>
                    </div>
                    {saved.supplements.map((supplement, i) => {
                        const { label, unit } = MICRONUTRIENT_INFO[supplement.key];
                        const need = dailyNeeds(standard, saved.sex, saved.age, saved.weightLb)[supplement.key];
                        const shown = supplement.percent ? supplement.dose / need * 100 : supplement.dose;
                        const change = (patch: Partial<Supplement>) =>
                            setSupplements(saved.supplements.map((s, j) => j === i ? { ...s, ...patch } : s));
                        const number = (value: string) => value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
                        return (
                            <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="w-28 shrink-0 text-neutral-600">{label}</span>
                                <input
                                    type="number" min={0} step="any" inputMode="decimal"
                                    value={shown ? Number(shown.toPrecision(4)) : ''}
                                    onChange={e => change({ dose: supplement.percent ? number(e.target.value) / 100 * need : number(e.target.value) })}
                                    aria-label={`${label} dose`}
                                    className="border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white w-20"
                                />
                                <select
                                    value={supplement.percent ? 'percent' : 'unit'}
                                    onChange={e => change({ percent: e.target.value === 'percent' })}
                                    aria-label={`${label} dose unit`}
                                    className="border border-neutral-200 rounded px-1 py-1 text-xs text-neutral-700 bg-white"
                                >
                                    <option value="unit">{unit}</option>
                                    <option value="percent">% RDA</option>
                                </select>
                                <span>per pill ×</span>
                                <input
                                    type="number" min={0} step="any" inputMode="decimal"
                                    value={supplement.perWeek || ''}
                                    onChange={e => change({ perWeek: number(e.target.value) })}
                                    aria-label={`${label} pills per week`}
                                    className="border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white w-16"
                                />
                                <span>per week</span>
                                <button
                                    onClick={() => setSupplements(saved.supplements.filter((_, j) => j !== i))}
                                    className="text-neutral-400 hover:text-red-500 leading-none"
                                    aria-label={`Remove ${label}`}
                                >✕</button>
                            </div>
                        );
                    })}
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
