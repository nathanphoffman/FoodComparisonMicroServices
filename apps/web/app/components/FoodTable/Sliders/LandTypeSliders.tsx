'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { LandTypeModal } from "../../Modals/LandTypeModal";
import type { LandTypes } from "@/lib/queries/commonFoods";

// Ordered from most to least harmful at the defaults.
const KEYS: (keyof LandTypes)[] = [
    'tropical_forest', 'wetland', 'tropical_savanna', 'temperate_forest', 'dry', 'temperate_grassland',
];

export const LAND_TYPE_LABELS: Record<keyof LandTypes, string> = {
    tropical_forest:     'Tropical Forest',
    wetland:             'Wetland / Mangrove',
    tropical_savanna:    'Tropical Savanna',
    temperate_forest:    'Temperate Forest',
    dry:                 'Dry / Mediterranean',
    temperate_grassland: 'Temperate Grassland',
};

const DESCRIPTIONS: Record<keyof LandTypes, string> = {
    tropical_forest:     'rainforest, much of it recently cleared',
    wetland:             'rice paddies, mangroves, peat swamp',
    tropical_savanna:    'Brazil’s Cerrado, African and Indian savanna',
    temperate_forest:    'farmland cleared centuries ago',
    dry:                 'irrigated orchards and Mediterranean groves',
    temperate_grassland: 'prairie and steppe cropland and pasture',
};

// 1.0 = neutral. Keep in sync with default_land_type_weights() in the Rust SliderQuery.
export const DEFAULT_LAND_TYPE_WEIGHTS: LandTypes = {
    tropical_forest:     3.0,
    wetland:             2.0,
    tropical_savanna:    1.5,
    temperate_forest:    1.0,
    dry:                 1.0,
    temperate_grassland: 0.75,
};

export function LandTypeSliders({ onChange }: { onChange?: (w: LandTypes) => void }) {
    const [weights, setWeights]     = useState<LandTypes>(DEFAULT_LAND_TYPE_WEIGHTS);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (key: keyof LandTypes, val: number) => {
        const next = { ...weights, [key]: val };
        setWeights(next);
        debouncedOnChange(next);
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="text-xs text-neutral-400">
                how much each m² of land counts toward the Land Use score, by the kind of land the food is grown on (1× = no change)
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-x-6">
                {KEYS.map(key => (
                    <div key={key} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-neutral-500">
                            <span>{LAND_TYPE_LABELS[key]}</span>
                            <span className="font-medium text-neutral-700">{weights[key].toFixed(2)}×</span>
                        </div>
                        <Slider min={0} max={5} step={0.25} value={weights[key]} onChange={val => handleChange(key, val)} />
                        <div className="text-xs text-neutral-400 mt-0.5">{DESCRIPTIONS[key]}</div>
                    </div>
                ))}
            </div>
            {showModal && <LandTypeModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
