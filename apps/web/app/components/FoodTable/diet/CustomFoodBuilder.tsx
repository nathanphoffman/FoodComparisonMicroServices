'use client';

import { useState } from 'react';
import type { CustomFoodInput } from '../types/FoodTableTypes';
import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import { DEFAULT_LEVEL, downloadDiet, toPercents } from './CustomFood/logic/CustomFoodSaved';
import { levelForFine, levelForPercent, type BuilderFood } from './CustomFood/logic/CustomFoodMath';
import { useDietState } from './CustomFood/logic/useDietState';
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
    const showCalories = !!diet;
    const { saved, problem, updateFoods, updateSettings, importDiet, caloriesPerDay, markActive } = useDietState({
        custom, foods, onChange, onSettingsChange: diet?.onSettingsChange,
    });
    const [selectedSlug, setSelectedSlug] = useState('');
    const { basis, ingredients } = saved;

    function addIngredient() {
        const food = foods.find(f => f.slug === selectedSlug);
        if (!food || ingredients.some(i => i.slug === selectedSlug)) return;
        updateFoods({ basis, ingredients: [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }] });
        setSelectedSlug('');
    }

    function slideIngredient(index: number, value: number) {
        markActive(ingredients[index].slug);
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

    const available = [...foods]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(f => !ingredients.some(i => i.slug === f.slug));

    return (
        <div className="flex flex-col gap-2">
            {problem && <p role="alert" className="text-sm text-red-600">{problem}</p>}
            {diet && <DietActions onExport={() => downloadDiet(saved, custom.slug)} onImport={importDiet} onShow={diet.onShow} hasFoods={ingredients.length > 0} />}
            {diet && <DietSettingsFields saved={saved} onChange={updateSettings} />}
            {diet && <SupplementEditor saved={saved} standard={diet.standard} onChange={updateSettings} />}
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
