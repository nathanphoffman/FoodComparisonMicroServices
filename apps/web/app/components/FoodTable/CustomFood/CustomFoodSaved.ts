import { MICRONUTRIENT_KEYS, type CustomFoodBasis, type MicronutrientKey } from '../FoodTableTypes';
import { DEFAULT_DAYS_BETWEEN } from '../FoodTableAbsorption';
import { ACTIVITY_LEVELS, DEFAULT_ACTIVITY } from '../FoodTableTargets';
import type { Sex } from '../FoodTableRda';

// Each ingredient has its own independent slider level; its percentage is its
// share of the total level (same idea as the Compare By / Score Priorities sliders).
// `fine` makes that ingredient's slider set its share directly, 0–1% in 0.005% steps.
export type Ingredient = { slug: string; name: string; level: number; fine?: boolean };

// A supplement: `dose` per pill in the nutrient's own unit, taken `perWeek` times a week.
// `percent` only changes how the dose is entered and shown (as % of your daily need); `dose` is always in the nutrient's unit.
export type Supplement = { key: MicronutrientKey; dose: number; perWeek: number; percent?: boolean };

// calorieTarget is the user's total calories per day, sex and age pick their daily vitamin and mineral needs
// (all null until entered).
export type Saved = { supplements: Supplement[]; pillAbsorption: number; basis: CustomFoodBasis; ingredients: Ingredient[]; calorieTarget: number | null; sex: Sex | null; age: number | null; weightLb: number | null; daysBetween: number; activity: number };

export const DAYS_PER_WEEK = 7;

// Share of a pill's dose that counts, on top of the per-sitting limit for B12, calcium and vitamin C.
export const DEFAULT_PILL_ABSORPTION = 75;

export const MAX_LEVEL = 100;
export const LEVEL_STEP = 0.5;
export const DEFAULT_LEVEL = MAX_LEVEL / 2;
export const FINE_MAX_PERCENT = 1;
export const FINE_STEP_PERCENT = 0.005;

/** A typed-in number that must be above 0; null when the box is empty or isn't one. */
export function positiveOrNull(value: string): number | null {
    const number = Number(value);
    return value !== '' && Number.isFinite(number) && number > 0 ? number : null;
}

// ── Percentage math ───────────────────────────────────────────────────────────

/** Each ingredient's percentage of the total level; all 0 if every slider is at 0. */
export function toPercents(ingredients: Ingredient[]): number[] {
    const total = ingredients.reduce((sum, ingredient) => sum + ingredient.level, 0);
    return ingredients.map(ingredient => total > 0 ? (ingredient.level / total) * 100 : 0);
}

// Small shares need three decimals now that fine control moves them in 0.005% steps.
export const formatPercent = (percent: number) => `${Number(percent.toFixed(percent < 1 ? 3 : 1))}%`;

// ── Saved state (localStorage, and the exported / imported file) ──────────────

const EMPTY_SAVED: Saved = { supplements: [], pillAbsorption: DEFAULT_PILL_ABSORPTION, basis: 'calories', ingredients: [], calorieTarget: null, sex: null, age: null, weightLb: null, daysBetween: DEFAULT_DAYS_BETWEEN, activity: DEFAULT_ACTIVITY };

/** Cleans up untrusted data (from localStorage or an imported file); null if it isn't a diet at all. */
export function sanitize(parsed: Saved | null, foods: { slug: string }[]): Saved | null {
    if (!parsed || !Array.isArray(parsed.ingredients)) return null;
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
}

/** What loading found: the diet to use, and a message when stored data was unreadable (so it wasn't silently thrown away). */
export type LoadResult = { saved: Saved; problem: string | null };

export function loadSaved(storageKey: string, foods: { slug: string }[]): LoadResult {
    let stored: string | null;
    try {
        stored = localStorage.getItem(storageKey);
    } catch (error) {
        console.error('Could not read the saved diet from this browser:', error);
        return { saved: EMPTY_SAVED, problem: "This browser won't let the site read your saved diet. Import a backup if you have one." };
    }
    if (stored === null) return { saved: EMPTY_SAVED, problem: null };
    try {
        const saved = sanitize(JSON.parse(stored), foods);
        if (saved) return { saved, problem: null };
    } catch (error) {
        console.error('The saved diet is not valid JSON:', error);
    }
    console.error('The saved diet has an unexpected shape:', stored);
    return { saved: EMPTY_SAVED, problem: "Your saved diet couldn't be read, so it was reset. Import a backup if you have one." };
}

/** Throws if the browser refuses the write (storage full or blocked), so the caller can tell the user. */
export function save(storageKey: string, value: Saved) {
    localStorage.setItem(storageKey, JSON.stringify(value));
}

// ── Export / import file ──────────────────────────────────────────────────────

/** Downloads the diet as a .json file. */
export function downloadDiet(value: Saved, filePrefix: string) {
    const blob = new Blob([JSON.stringify({ type: 'diet', version: 1, ...value }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/** A diet read from an imported file, and how many of its foods are no longer available. */
export type ImportedDiet = { saved: Saved; droppedFoodCount: number };

/** Reads a file picked for import; throws an Error saying what is wrong if it isn't a diet export. */
export async function readDietFile(file: File, foods: { slug: string }[]): Promise<ImportedDiet> {
    let parsed: Saved;
    try {
        parsed = JSON.parse(await file.text());
    } catch {
        throw new Error("That file isn't valid JSON, so it can't be a diet export.");
    }
    const saved = sanitize(parsed, foods);
    if (!saved) throw new Error("That file has no list of foods, so it isn't a diet export.");
    return { saved, droppedFoodCount: parsed.ingredients.length - saved.ingredients.length };
}
