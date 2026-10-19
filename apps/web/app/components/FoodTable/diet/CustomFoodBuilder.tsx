'use client';

import { useState, useEffect } from 'react';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../../hooks/useDebouncedCallback';
import type { CustomFoodInput } from '../types/FoodTableTypes';
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from '../nutrition/FoodTableRda';
import { DEFAULT_LEVEL, downloadDiet, loadSaved, readDietFile, save, toPercents, type Saved } from './CustomFood/logic/CustomFoodSaved';
import { caloriesPerDayIn, levelForFine, levelForPercent, settingsOf, toInput, type BuilderFood } from './CustomFood/logic/CustomFoodMath';
import { DietActions } from './CustomFood/inputs/DietActions';
import { DietSettingsFields } from './CustomFood/inputs/DietSettingsFields';
import { SupplementEditor } from './CustomFood/inputs/SupplementEditor';
import { IngredientPicker } from './CustomFood/inputs/IngredientPicker';
import { IngredientList } from './CustomFood/inputs/IngredientList';

/** What turns a custom food into the whole-diet builder: calories and daily needs, and the breakdown window. */
export type DietOptions = {
    /** Whose recommended intakes a supplement's % RDA is measured against. */
    standard: NutrientStandard;
    /** Opens the diet's nutrition breakdown; the "Show Diet" button is greyed out until a food is added. */
    onShow: () => void;
    /** Reports the daily calories, sex and age once typing settles (and once on load). */
    onSettingsChange: (settings: DietSettings) => void;
};

type Props = {
    custom: { slug: string; name: string; storageKey: string };
    foods: BuilderFood[];
    /** Set for the whole diet: shows the calories / day field and each food's calories per day and week. */
    diet?: DietOptions;
    onChange: (food: CustomFoodInput) => void;
};

/**
 * Builds a custom food (a meal or a whole diet) from other foods, each given a
 * slider whose share becomes its percentage of calories or of mass. Saved in localStorage, so it survives reloads,
 * and can be exported to a file and imported back.
 */
export function CustomFoodBuilder({ custom, foods, diet, onChange }: Props) {
    const { slug, name, storageKey } = custom;
    const showCalories = !!diet;
    const standard = diet?.standard ?? DEFAULT_NUTRIENT_STANDARD;
    const { onShow, onSettingsChange } = diet ?? {};
    const [loaded]                        = useState(() => loadSaved(storageKey, foods));
    const [saved, setSaved]               = useState<Saved>(loaded.saved);
    // Shown in red under the buttons: what went wrong loading, saving or importing the diet.
    const [problem, setProblem]            = useState<string | null>(loaded.problem);
    const [selectedSlug, setSelectedSlug] = useState('');
    // The calorie lines follow this delayed copy, so they update with the table instead of on every slider move.
    // The slider being dragged (activeSlug) is the exception: its own line follows the live state.
    const [settled, setSettled]       = useState<Saved>(saved);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const { basis, ingredients } = saved;

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);
    const debouncedSettings = useDebouncedCallback((next: Saved) => onSettingsChange?.(settingsOf(next, foods)), DEBOUNCE_MS);
    const debouncedSettle   = useDebouncedCallback((next: Saved) => {
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

    function addIngredient() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        updateFoods({ basis, ingredients: [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }] });
        setSelectedSlug('');
    }

    function slideIngredient(index: number, value: number) {
        setActiveSlug(ingredients[index].slug);
        const level = ingredients[index].fine ? levelForPercent(ingredients, index, value) : value;
        updateFoods({ basis, ingredients: ingredients.map((ing, j) => j === index ? { ...ing, level } : ing) });
    }

    // Fine control sets the share directly (0–1%), so a share above that is brought down to the top of its range.
    function setFine(index: number, fine: boolean) {
        updateFoods({
            basis,
            ingredients: ingredients.map((ing, j) => j !== index ? ing : { ...ing, fine, level: fine ? levelForFine(ingredients, index) : ing.level }),
        });
    }

    // The item being adjusted updates live; every other item waits for the debounce.
    const caloriesPerDay = (ingredientSlug: string) => caloriesPerDayIn(ingredientSlug === activeSlug ? saved : settled, foods, ingredientSlug);

    const available = [...foods]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(f => !ingredients.some(i => i.slug === f.slug));

    return (
        <div className="flex flex-col gap-2">
            {problem && <p role="alert" className="text-sm text-red-600">{problem}</p>}
            {showCalories && <DietActions onExport={() => downloadDiet(saved, slug)} onImport={importDiet} onShow={onShow} hasFoods={ingredients.length > 0} />}
            {showCalories && <DietSettingsFields saved={saved} onChange={updateSettings} />}
            {showCalories && <SupplementEditor saved={saved} standard={standard} onChange={updateSettings} />}
            <IngredientPicker
                available={available}
                selectedSlug={selectedSlug}
                basis={basis}
                onSelect={setSelectedSlug}
                onAdd={addIngredient}
                onBasisChange={newBasis => updateFoods({ basis: newBasis, ingredients })}
            />
            {ingredients.length > 0 && (
                <IngredientList
                    ingredients={ingredients}
                    percents={toPercents(ingredients)}
                    caloriesPerDay={caloriesPerDay}
                    showCalories={showCalories}
                    onSlide={slideIngredient}
                    onFineChange={setFine}
                    onRemove={removedSlug => updateFoods({ basis, ingredients: ingredients.filter(i => i.slug !== removedSlug) })}
                />
            )}
        </div>
    );
}
