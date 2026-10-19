import type { DietBasis } from '../../../types/FoodTableTypes';

const BASIS_OPTIONS: { value: DietBasis; label: string }[] = [
    { value: 'calories', label: 'By calories' },
    { value: 'mass',     label: 'By mass' },
];

type Props = {
    /** Foods not yet in the diet. */
    available: { slug: string; name: string }[];
    selectedSlug: string;
    basis: DietBasis;
    onSelect: (slug: string) => void;
    onAdd: () => void;
    onBasisChange: (basis: DietBasis) => void;
};

/** Pick a food to add, and choose whether the percentages are of calories or of mass. */
export function IngredientPicker({ available, selectedSlug, basis, onSelect, onAdd, onBasisChange }: Props) {
    return (
        <div className="flex gap-2 items-center">
            <select
                value={selectedSlug}
                onChange={e => onSelect(e.target.value)}
                className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white flex-1 min-w-0"
            >
                <option value="">Select a food…</option>
                {available.map(f => (
                    <option key={f.slug} value={f.slug}>{f.name}</option>
                ))}
            </select>
            <button
                onClick={onAdd}
                disabled={!selectedSlug}
                className="px-3 py-1 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 shrink-0"
            >
                Add
            </button>
            <select
                value={basis}
                onChange={e => onBasisChange(e.target.value as DietBasis)}
                aria-label="What the percentages are of"
                className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white shrink-0"
            >
                {BASIS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}
