'use client';

import type { RawFood } from '@/lib/queries/commonFoods';

// Each filter matches foods by their data category (the foods/<category>.json file)
// and/or a tag. A food can appear under more than one filter — almond milk is both
// a Milk and a Nut product.
type FoodFilter = {
    key:         string;
    label:       string;
    categories?: string[];
    tag?:        string;
};

export const FOOD_FILTERS: FoodFilter[] = [
    { key: 'all',        label: 'All' },
    { key: 'milks',      label: 'Milks',        tag: 'milk' },
    { key: 'dairy-eggs', label: 'Dairy & Eggs', categories: ['dairy', 'eggs'] },
    { key: 'meat',       label: 'Meat',         categories: ['meats'] },
    { key: 'seafood',    label: 'Seafood',      categories: ['seafood'] },
    { key: 'grains',     label: 'Grains',       categories: ['grains'] },
    { key: 'legumes',    label: 'Legumes',      categories: ['legumes'] },
    { key: 'nuts-seeds', label: 'Nuts & Seeds', categories: ['nuts', 'seeds'] },
    { key: 'vegetables', label: 'Vegetables',   categories: ['vegetables', 'leafy'] },
    { key: 'fruits',     label: 'Fruits',       categories: ['fruits'] },
    { key: 'oils',       label: 'Oils',         categories: ['oils'] },
];

export const DEFAULT_FOOD_FILTER = 'all';

export function matchesFoodFilter(food: RawFood, filterKey: string): boolean {
    const filter = FOOD_FILTERS.find(f => f.key === filterKey);
    if (!filter || (!filter.categories && !filter.tag)) return true;
    return (filter.categories?.includes(food.category ?? '') ?? false)
        || (filter.tag !== undefined && (food.tags ?? []).includes(filter.tag));
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
