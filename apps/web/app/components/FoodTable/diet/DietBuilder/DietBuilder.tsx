'use client';

import { DIET, type DietInput } from '../../types/FoodTableTypes';
import type { DietSettings, NutrientStandard } from '../../nutrition/FoodTableRda';
import { downloadDiet, toPercents } from './logic/DietSaved';
import type { BuilderFood } from './logic/DietMath';
import { useDietState } from './logic/useDietState';
import { useIngredientEditing } from './logic/useIngredientEditing';
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
    const editing = useIngredientEditing({ foods, saved, updateFoods, markActive });
    const { basis, ingredients } = saved;

    return (
        <div className="flex flex-col gap-2">
            {problem && <p role="alert" className="text-sm text-red-600">{problem}</p>}
            <DietActions onExport={() => downloadDiet(saved, DIET.slug)} onImport={importDiet} onShow={options.onShow} hasFoods={ingredients.length > 0} />
            <DietSettingsFields saved={saved} onChange={updateSettings} />
            <SupplementEditor saved={saved} standard={options.standard} onChange={updateSettings} />
            <IngredientPicker
                available={editing.available}
                selectedSlug={editing.selectedSlug}
                basis={basis}
                onSelect={editing.setSelectedSlug}
                onAdd={editing.addIngredient}
                onBasisChange={editing.changeBasis}
            />
            {ingredients.length > 0 && (
                <IngredientList
                    ingredients={ingredients}
                    percents={toPercents(ingredients)}
                    caloriesPerDay={caloriesPerDay}
                    onSlide={editing.slideIngredient}
                    onFineChange={editing.setFine}
                    onRemove={editing.removeIngredient}
                />
            )}
        </div>
    );
}
