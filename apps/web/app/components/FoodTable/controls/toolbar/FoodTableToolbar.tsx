'use client';

import type { DataRegion } from '../../types/FoodTableTypes';
import type { SortKey } from '../../scoring/FoodTableSort';
import { NUTRIENT_STANDARD_OPTIONS, type NutrientStandard } from '../../nutrition/FoodTableRda';
import { DATA_REGION_OPTIONS } from '../../scoring/FoodTableDefaults';
import { SelectField } from '../../../Inputs/SelectField';
import { ColumnPicker } from './ColumnPicker';

/** Which data region and whose daily needs the table uses, with the setters for both. */
export type DataSettings = {
    dataRegion: DataRegion;
    onDataRegionChange: (region: DataRegion) => void;
    nutrientStandard: NutrientStandard;
    onNutrientStandardChange: (standard: NutrientStandard) => void;
};

type Props = {
    dataSettings: DataSettings;
    reference: { slug: string; onChange: (slug: string) => void };
    foods: { slug: string; name: string }[];
    columns: { visible: Set<SortKey>; onToggle: (key: SortKey) => void };
};

const QUIET_LABEL = 'text-neutral-500';
const NARROW_SELECT = 'max-w-[10rem]';

export function FoodTableToolbar({ dataSettings, reference, foods, columns }: Props) {
    const { dataRegion, onDataRegionChange, nutrientStandard, onNutrientStandardChange } = dataSettings;
    const foodOptions = [...foods].sort((first, second) => first.name.localeCompare(second.name)).map(food => ({ value: food.slug, label: food.name }));

    return (
        <div className="flex flex-wrap justify-end items-center gap-3 mb-2">
            <SelectField label="Data region" value={dataRegion} options={DATA_REGION_OPTIONS} onChange={onDataRegionChange}
                labelClassName={QUIET_LABEL} selectClassName={NARROW_SELECT} />
            <SelectField label="Daily needs" value={nutrientStandard} options={NUTRIENT_STANDARD_OPTIONS} onChange={onNutrientStandardChange}
                labelClassName={QUIET_LABEL} selectClassName={NARROW_SELECT} />
            <SelectField label="Compare vs." value={reference.slug} options={foodOptions} onChange={reference.onChange}
                labelClassName={QUIET_LABEL} selectClassName={NARROW_SELECT} />
            <ColumnPicker visible={columns.visible} onToggle={columns.onToggle} />
        </div>
    );
}
