'use client';

import { useState } from 'react';
import { DIET, type DietInput } from '../../types/FoodTableTypes';
import type { DietSettings, NutrientStandard } from '../../nutrition/FoodTableRda';
import { DEFAULT_LEVEL, downloadDiet, toPercents } from './logic/DietSaved';
import { levelForFine, levelForPercent, type BuilderFood } from './logic/DietMath';
import { useDietState } from './logic/useDietState';
import { DietActions } from './inputs/DietActions';
import { DietSettingsFields } from './inputs/DietSettingsFields';
import { SupplementEditor } from './inputs/SupplementEditor';
import { IngredientPicker } from './inputs/IngredientPicker';
import { IngredientList } from './inputs/IngredientList';

/** How the diet builder talks to the rest of the page: daily needs, the breakdown window, and the daily settings. */
export type DietOptions = {
    /** Whose recommended intakes a supplement's % RDA is measured against. */
    standard: NutrientStandard;
    /** Opens the diet's nutrition breakdown; the "Show Diet" button is greyed out until a food is added. */
    onShow: () => void;
    /** Reports the daily calories, sex and age once typing settles (and once on load). */
    onSettingsChange: (settings: DietSettings) => void;
};

type Props = {
    foods: BuilderFood[];
    options: DietOptions;
    onChange: (diet: DietInput) => void;
};

/**
 * Plans a diet from other foods, each given a slider whose share becomes its percentage of calories or of mass. Saved in localStorage, so it survives reloads,
 * and can be exported to a file and imported back.
 */
export function DietBuilder({ foods, options, onChange }: Props) {
    const { saved, problem, updateFoods, updateSettings, importDiet, caloriesPerDay, markActive } = useDietState({
        diet: DIET, foods, onChange, onSettingsChange: options.onSettingsChange,
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
            <DietActions onExport={() => downloadDiet(saved, DIET.slug)} onImport={importDiet} onShow={options.onShow} hasFoods={ingredients.length > 0} />
            <DietSettingsFields saved={saved} onChange={updateSettings} />
            <SupplementEditor saved={saved} standard={options.standard} onChange={updateSettings} />
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
                    onSlide={slideIngredient}
                    onFineChange={setFine}
                    onRemove={removedSlug => updateFoods({ basis, ingredients: ingredients.filter(i => i.slug !== removedSlug) })}
                />
            )}
        </div>
    );
}
