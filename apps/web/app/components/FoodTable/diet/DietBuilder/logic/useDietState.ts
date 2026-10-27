import { useEffect, useState } from 'react';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../../../../hooks/useDebouncedCallback';
import type { DietInput } from '../../../types/FoodTableTypes';
import type { DietSettings } from '../../../nutrition/FoodTableRda';
import { loadSaved, readDietFile, save, type Saved } from './DietSaved';
import { caloriesPerDayIn, settingsOf, toInput, type BuilderFood } from './DietMath';

type DietIdentity = { slug: string; name: string; storageKey: string };

/** The saved diet, kept in this browser. `problem` is what went wrong loading or saving it, for the user to read. */
function useSavedDiet(storageKey: string, foods: BuilderFood[]) {
    const [loaded] = useState(() => loadSaved(storageKey, foods));
    const [saved, setSaved] = useState<Saved>(loaded.saved);
    const [problem, setProblem] = useState<string | null>(loaded.problem);

    // If the browser refuses the write, the diet still works but the user is told it won't survive a reload.
    function keep(next: Saved) {
        setSaved(next);
        try {
            save(storageKey, next);
        } catch (error) {
            console.error('Could not save the diet in this browser:', error);
            setProblem("Your diet couldn't be saved in this browser, so it will be lost on reload. Use Export Diet to keep a copy.");
        }
    }

    return { saved, problem, setProblem, keep };
}

/**
 * The calorie lines follow a delayed copy of the diet, so they update with the table instead of on every slider move.
 * The slider being dragged (the active one) is the exception: its own line follows the live diet.
 */
function useSettledDiet(initial: Saved, foods: BuilderFood[]) {
    const [settled, setSettled] = useState<Saved>(initial);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const settleLater = useDebouncedCallback((next: Saved) => {
        setSettled(next);
        setActiveSlug(null);
    }, DEBOUNCE_MS);

    const caloriesPerDay = (live: Saved, ingredientSlug: string) =>
        caloriesPerDayIn(ingredientSlug === activeSlug ? live : settled, foods, ingredientSlug);

    return { settleNow: setSettled, settleLater, markActive: setActiveSlug, caloriesPerDay };
}

type Options = {
    diet: DietIdentity;
    foods: BuilderFood[];
    onChange: (food: DietInput) => void;
    onSettingsChange?: (settings: DietSettings) => void;
};

/** Everything the diet builder remembers: the saved diet, telling the table when it changes, and importing a file. */
export function useDietState({ diet, foods, onChange, onSettingsChange }: Options) {
    const { slug, name, storageKey } = diet;
    const { saved, problem, setProblem, keep } = useSavedDiet(storageKey, foods);
    const { settleNow, settleLater, markActive, caloriesPerDay } = useSettledDiet(saved, foods);
    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);
    const debouncedSettings = useDebouncedCallback((next: Saved) => onSettingsChange?.(settingsOf(next, foods)), DEBOUNCE_MS);

    // Tell the table about the saved food right away on load.
    useEffect(() => {
        onChange(toInput(slug, name, saved));
        onSettingsChange?.(settingsOf(saved, foods));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Changes to the diet's foods or basis: saved, then the table rescores the food and the calorie lines catch up.
    function updateFoods(patch: Pick<Saved, 'basis' | 'ingredients'>) {
        const next = { ...saved, ...patch };
        keep(next);
        debouncedOnChange(toInput(slug, name, next));
        settleLater(next);
    }

    // Changes to the person's settings or supplements: nothing to rescore, only the whole-diet tooltip numbers change.
    function updateSettings(patch: Partial<Saved>) {
        const next = { ...saved, ...patch };
        keep(next);
        debouncedSettings(next);
        if ('calorieTarget' in patch) settleLater(next);
    }

    // Loads a diet from a backup file the user picked; problems are shown to the user, not thrown.
    async function importDiet(file: File | undefined) {
        if (!file) return;
        try {
            const { saved: next, droppedFoodCount } = await readDietFile(file, foods);
            keep(next);
            settleNow(next);
            onChange(toInput(slug, name, next));
            onSettingsChange?.(settingsOf(next, foods));
            setProblem(droppedFoodCount > 0 ? `Imported, but ${droppedFoodCount} food(s) in the file are no longer available and were skipped.` : null);
        } catch (error) {
            console.error('Could not import the diet:', error);
            setProblem(error instanceof Error ? error.message : String(error));
        }
    }

    return { saved, problem, updateFoods, updateSettings, importDiet, markActive, caloriesPerDay: (ingredientSlug: string) => caloriesPerDay(saved, ingredientSlug) };
}
