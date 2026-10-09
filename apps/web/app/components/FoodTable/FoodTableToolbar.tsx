'use client';

import { useState, useRef, useEffect } from 'react';
import type { DataRegion } from './FoodTableTypes';
import type { SortKey } from './FoodTableSort';
import { NUTRIENT_STANDARD_OPTIONS, type NutrientStandard } from './FoodTableRda';
import { COLUMN_CONFIG, DATA_REGION_OPTIONS } from './FoodTableDefaults';

type Props = {
    dataRegion: DataRegion;
    onDataRegionChange: (region: DataRegion) => void;
    nutrientStandard: NutrientStandard;
    onNutrientStandardChange: (standard: NutrientStandard) => void;
    referenceSlug: string;
    onReferenceSlugChange: (slug: string) => void;
    foods: { slug: string; name: string }[];
    visibleColumns: Set<SortKey>;
    onToggleColumn: (key: SortKey) => void;
};

export function FoodTableToolbar({
    dataRegion,
    onDataRegionChange,
    nutrientStandard,
    onNutrientStandardChange,
    referenceSlug,
    onReferenceSlugChange,
    foods,
    visibleColumns,
    onToggleColumn,
}: Props) {
    const [showToggle, setShowToggle] = useState(false);
    const toggleRef                   = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: PointerEvent) {
            if (toggleRef.current && !toggleRef.current.contains(e.target as Node)) {
                setShowToggle(false);
            }
        }
        document.addEventListener('pointerdown', onClickOutside);
        return () => document.removeEventListener('pointerdown', onClickOutside);
    }, []);

    return (
        <div className="flex flex-wrap justify-end items-center gap-3 mb-2" ref={toggleRef}>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Data region</span>
                <select
                    value={dataRegion}
                    onChange={e => onDataRegionChange(e.target.value as DataRegion)}
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white max-w-[10rem]"
                >
                    {DATA_REGION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Daily needs</span>
                <select
                    value={nutrientStandard}
                    onChange={e => onNutrientStandardChange(e.target.value as NutrientStandard)}
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white max-w-[10rem]"
                >
                    {NUTRIENT_STANDARD_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Compare vs.</span>
                <select
                    value={referenceSlug}
                    onChange={e => onReferenceSlugChange(e.target.value)}
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white max-w-[10rem]"
                >
                    {[...foods].sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                        <option key={f.slug} value={f.slug}>{f.name}</option>
                    ))}
                </select>
            </div>
            <div className="relative">
                <button
                    onClick={() => setShowToggle(v => !v)}
                    className="text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-200 rounded px-3 py-1 flex items-center gap-1"
                >
                    Columns <span className="text-xs">{showToggle ? '▴' : '▾'}</span>
                </button>
                {showToggle && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded shadow-md p-3 space-y-2 z-10 min-w-[160px]">
                        {COLUMN_CONFIG.filter(c => c.key !== 'name').map(col => (
                            <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.has(col.key)}
                                    onChange={() => onToggleColumn(col.key)}
                                    className="accent-neutral-700"
                                />
                                {col.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
