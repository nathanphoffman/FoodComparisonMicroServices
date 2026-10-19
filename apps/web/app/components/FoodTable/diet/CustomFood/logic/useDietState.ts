import { useEffect, useState } from 'react';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../../../../hooks/useDebouncedCallback';
import type { CustomFoodInput } from '../../../types/FoodTableTypes';
import type { DietSettings } from '../../../nutrition/FoodTableRda';
import { loadSaved, readDietFile, save, type Saved } from './CustomFoodSaved';
import { caloriesPerDayIn, settingsOf, toInput, type BuilderFood } from './CustomFoodMath';

type Options = {
    custom: { slug: string; name: string; storageKey: string };
    foods: BuilderFood[];
    onChange: (food: CustomFoodInput) => void;
    onSettingsChange?: (settings: DietSettings) => void;
};

/**
 * Everything a custom food remembers: the saved diet, keeping it in this browser, telling the table when it changes,
 * importing a file, and the problem message to show when any of that goes wrong.
 */
export function useDietState({ custom, foods, onChange, onSettingsChange }: Options) {
    const { slug, name, storageKey } = custom;
    const [loaded] = useState(() => loadSaved(storageKey, foods));
    const [saved, setSaved] = useState<Saved>(loaded.saved);
    // What went wrong loading, saving or importing the diet, for the user to read.
    const [problem, setProblem] = useState<string | null>(loaded.problem);
    // The calorie lines follow this delayed copy, so they update with the table instead of on every slider move.
    // The slider being dragged (activeSlug) is the exception: its own line follows the live state.
    const [settled, setSettled] = useState<Saved>(saved);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);
    const debouncedSettings = useDebouncedCallback((next: Saved) => onSettingsChange?.(settingsOf(next, foods)), DEBOUNCE_MS);
    const debouncedSettle = useDebouncedCallback((next: Saved) => {
        setSettled(next);
        setActiveSlug(null);
    }, DEBOUNCE_MS);

    // Tell the table about the saved food right away on load.
    useEffect(() => {
        onChange(toInput(slug, name, saved));
        onSettingsChange?.(settingsOf(saved, foods));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keeps the diet in this browser; if that fails, the diet still works but the user is told it won't survive a reload.
    function persist(next: Saved) {
        try {
            save(storageKey, next);
        } catch (error) {
            console.error('Could not save the diet in this browser:', error);
            setProblem("Your diet couldn't be saved in this browser, so it will be lost on reload. Use Export Diet to keep a copy.");
        }
    }

    // Changes to the diet's foods or basis: saved, then the table rescores the food and the calorie lines catch up.
    function updateFoods(patch: Pick<Saved, 'basis' | 'ingredients'>) {
        const next = { ...saved, ...patch };
        setSaved(next);
        persist(next);
        debouncedOnChange(toInput(slug, name, next));
        debouncedSettle(next);
    }

    // Changes to the person's settings or supplements: nothing to rescore, only the whole-diet tooltip numbers change.
    function updateSettings(patch: Partial<Saved>) {
        const next = { ...saved, ...patch };
        setSaved(next);
        persist(next);
        debouncedSettings(next);
        if ('calorieTarget' in patch) debouncedSettle(next);
    }

    async function importDiet(file: File | undefined) {
        if (!file) return;
        try {
            const { saved: next, droppedFoodCount } = await readDietFile(file, foods);
            setSaved(next);
            setSettled(next);
            persist(next);
            onChange(toInput(slug, name, next));
            onSettingsChange?.(settingsOf(next, foods));
            setProblem(droppedFoodCount > 0 ? `Imported, but ${droppedFoodCount} food(s) in the file are no longer available and were skipped.` : null);
        } catch (error) {
            console.error('Could not import the diet:', error);
            setProblem(error instanceof Error ? error.message : String(error));
        }
    }

    // The item being adjusted updates live; every other item waits for the debounce.
    const caloriesPerDay = (ingredientSlug: string) => caloriesPerDayIn(ingredientSlug === activeSlug ? saved : settled, foods, ingredientSlug);

    return { saved, problem, updateFoods, updateSettings, importDiet, caloriesPerDay, markActive: setActiveSlug };
}
