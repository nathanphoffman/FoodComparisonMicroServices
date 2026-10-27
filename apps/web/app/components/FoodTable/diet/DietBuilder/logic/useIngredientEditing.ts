import { useState } from 'react';
import { DEFAULT_LEVEL, type Saved } from './DietSaved';
import { levelForFine, levelForPercent, type BuilderFood } from './DietMath';

type Options = {
    foods: BuilderFood[];
    saved: Saved;
    /** Saves a change to the diet's foods and rescores. */
    updateFoods: (patch: Pick<Saved, 'basis' | 'ingredients'>) => void;
    /** Tells the calorie lines which ingredient's slider is being dragged. */
    markActive: (slug: string) => void;
};

/** Adding, removing and adjusting the diet's ingredients, and the foods still available to add. */
export function useIngredientEditing({ foods, saved, updateFoods, markActive }: Options) {
    const { basis, ingredients } = saved;
    const [selectedSlug, setSelectedSlug] = useState('');

    function addIngredient() {
        const food = foods.find(candidate => candidate.slug === selectedSlug);
        if (!food || ingredients.some(ingredient => ingredient.slug === selectedSlug)) return;
        updateFoods({ basis, ingredients: [...ingredients, { slug: food.slug, name: food.name, level: DEFAULT_LEVEL }] });
        setSelectedSlug('');
    }

    function slideIngredient(index: number, value: number) {
        markActive(ingredients[index].slug);
        const level = ingredients[index].fine ? levelForPercent(ingredients, index, value) : value;
        updateFoods({ basis, ingredients: ingredients.map((ingredient, position) => position === index ? { ...ingredient, level } : ingredient) });
    }

    // Fine control sets the share directly (0–1%), so a share above that is brought down to the top of its range.
    function setFine(index: number, fine: boolean) {
        updateFoods({
            basis,
            ingredients: ingredients.map((ingredient, position) => position !== index ? ingredient : { ...ingredient, fine, level: fine ? levelForFine(ingredients, index) : ingredient.level }),
        });
    }

    const available = [...foods]
        .sort((first, second) => first.name.localeCompare(second.name))
        .filter(food => !ingredients.some(ingredient => ingredient.slug === food.slug));

    return {
        selectedSlug, setSelectedSlug, available, addIngredient, slideIngredient, setFine,
        removeIngredient: (slug: string) => updateFoods({ basis, ingredients: ingredients.filter(ingredient => ingredient.slug !== slug) }),
        changeBasis: (newBasis: Saved['basis']) => updateFoods({ basis: newBasis, ingredients }),
    };
}
