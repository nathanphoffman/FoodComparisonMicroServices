'use client';

import { CUSTOM_FOODS, customFoodStub, type RawFood } from '../../types/FoodTableTypes';
import type { ScoredRow } from '../../scoring/FoodTableSort';

// Each filter matches foods by their data category (the foods/<category>.json file)
// and/or any of its tags. A food can appear under more than one filter — almond milk
// is both a Milk and a Nut product, and the Beyond Burger is both Meat and Vegan.
type FoodFilter = {
    key:         string;
    label:       string;
    categories?: string[];
    tags?:       string[];
};

export const FOOD_FILTERS: FoodFilter[] = [
    { key: 'all',        label: 'All' },
    { key: 'milks',      label: 'Milks',        tags: ['milk'] },
    { key: 'dairy-eggs', label: 'Dairy & Eggs', categories: ['dairy', 'eggs'], tags: ['dairy'] },
    { key: 'dairy-eggs-substitutes', label: 'Dairy & Eggs & Substitutes', categories: ['dairy', 'eggs'], tags: ['dairy', 'milk', 'cheese-substitute', 'ice-cream'] },
    { key: 'meat',       label: 'Meat',         categories: ['meats'], tags: ['meat-substitute'] },
    { key: 'seafood',    label: 'Seafood',      categories: ['seafood'] },
    { key: 'grains',     label: 'Grains',       categories: ['grains'], tags: ['grain-product'] },
    { key: 'legumes',    label: 'Legumes',      categories: ['legumes'], tags: ['legume-product'] },
    { key: 'nuts-seeds', label: 'Nuts & Seeds', categories: ['nuts', 'seeds'], tags: ['nut-product'] },
    { key: 'vegetables', label: 'Vegetables',   categories: ['vegetables', 'leafy'] },
    { key: 'fruits',     label: 'Fruits',       categories: ['fruits'] },
    { key: 'oils',       label: 'Oils',         categories: ['oils'] },
    { key: 'sweeteners', label: 'Sweeteners',   categories: ['sweeteners'], tags: ['sweetener'] },
    { key: 'beverages',  label: 'Beverages',    categories: ['beverages'], tags: ['beverage'] },
    { key: 'composites', label: 'Composites',   categories: ['composites'] },
    { key: 'vegan',      label: 'Vegan-Substitutes', tags: ['vegan'] },
];

export const DEFAULT_FOOD_FILTER = 'all';

export function matchesFoodFilter(food: RawFood, filterKey: string): boolean {
    const filter = FOOD_FILTERS.find(f => f.key === filterKey);
    if (!filter || (!filter.categories && !filter.tags)) return true;
    return (filter.categories?.includes(food.category ?? '') ?? false)
        || (filter.tags?.some(tag => (food.tags ?? []).includes(tag)) ?? false);
}

/**
 * The foods to list: those matching the filter, plus the custom meal / diet rows once they're scored.
 * Filtering only hides rows; every food is still scored so scores don't shift with the filter.
 */
export function foodsToShow(rawFoods: RawFood[], filterKey: string, scored: Map<string, ScoredRow>): RawFood[] {
    const visibleFoods = rawFoods.filter(food => matchesFoodFilter(food, filterKey));
    const customRows = CUSTOM_FOODS.filter(custom => scored.has(custom.slug)).map(custom => customFoodStub(custom.slug, custom.name));
    return [...visibleFoods, ...customRows];
}

export function FoodTableFilters({ selected, onChange }: { selected: string; onChange: (key: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {FOOD_FILTERS.map(filter => {
                const active = filter.key === selected;
                return (
                    <button
                        key={filter.key}
                        type="button"
                        onClick={() => onChange(filter.key)}
                        aria-pressed={active}
                        className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                            active
                                ? 'bg-neutral-800 border-neutral-800 text-white'
                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-800'
                        }`}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
