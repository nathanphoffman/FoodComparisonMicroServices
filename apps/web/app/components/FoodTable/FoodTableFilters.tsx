'use client';

import type { RawFood } from './FoodTableTypes';

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
    { key: 'dairy-eggs', label: 'Dairy & Eggs', categories: ['dairy', 'eggs'], tags: ['cheese-substitute', 'dairy'] },
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
