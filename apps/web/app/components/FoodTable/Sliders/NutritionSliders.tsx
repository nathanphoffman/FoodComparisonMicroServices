'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { NutritionWeightsModal } from "../../Modals/NutritionWeightsModal";
import type { NutritionWeights } from "../FoodTableTypes";
import { DEFAULT_NUTRITION_WEIGHTS } from "../FoodTableDefaults";

type NutritionSliderSettings = {
    label:       string;
    description: string;
    max:         number;
    step:        number;
    format:      (value: number) => string;
};

const points = (unit: string) => (value: number) => `${value} pt${value === 1 ? '' : 's'} / ${unit}`;

// Helps first (protein quality sits right after protein: it only ever reduces the protein points), then harms, then the sugar allowance that tunes the sugar penalty.
const SETTINGS: Record<keyof NutritionWeights, NutritionSliderSettings> = {
    protein: {
        label: 'Protein', description: 'helps the score: points per gram of protein',
        max: 5, step: 0.1, format: points('g'),
    },
    proteinQuality: {
        label: 'Protein Quality', description: 'harms the score: share of the protein points lost when a food is short of an essential amino acid (0% ignores amino acids)',
        max: 1, step: 0.05, format: value => `${Math.round(value * 100)}% of the shortfall`,
    },
    fiber: {
        label: 'Fiber', description: 'helps the score: points per gram of fiber',
        max: 5, step: 0.1, format: points('g'),
    },
    micronutrients: {
        label: 'Vitamins & Minerals', description: 'helps the score: points per 100% daily value of a vitamin, mineral or omega-3',
        max: 5, step: 0.1, format: points('100% DV'),
    },
    satFat: {
        label: 'Saturated Fat', description: 'harms the score: points lost per gram of saturated fat',
        max: 5, step: 0.1, format: points('g'),
    },
    freeSugar: {
        label: 'Free Sugar', description: 'harms the score: points lost per gram of sugar not covered by the fiber allowance',
        max: 2, step: 0.05, format: points('g'),
    },
    sodium: {
        label: 'Sodium', description: 'harms the score: points lost per 100 mg of sodium',
        max: 10, step: 0.1, format: points('100 mg'),
    },
    sugarAllowance: {
        label: 'Sugar Allowance per Fiber', description: 'helps sugary foods with fiber (fruit): grams of sugar per gram of fiber that aren\'t penalised',
        max: 20, step: 0.5, format: value => `${value} g / g fiber`,
    },
};

const KEYS = Object.keys(SETTINGS) as (keyof NutritionWeights)[];

export function NutritionSliders({ onChange, initialWeights = DEFAULT_NUTRITION_WEIGHTS }: { onChange?: (w: NutritionWeights) => void; initialWeights?: NutritionWeights }) {
    const [weights, setWeights]     = useState<NutritionWeights>(initialWeights);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (key: keyof NutritionWeights, val: number) => {
        const next = { ...weights, [key]: val };
        setWeights(next);
        debouncedOnChange(next);
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="text-xs text-neutral-400">
                how many points each nutrient adds to or takes from the Nutrition score (per 100 g of food, then scaled to per 100 calories)
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-x-6">
                {KEYS.map(key => (
                    <div key={key} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-neutral-500">
                            <span>{SETTINGS[key].label}</span>
                            <span className="font-medium text-neutral-700">{SETTINGS[key].format(weights[key])}</span>
                        </div>
                        <Slider min={0} max={SETTINGS[key].max} step={SETTINGS[key].step} value={weights[key]} onChange={val => handleChange(key, val)} />
                        <div className="text-xs text-neutral-400 mt-0.5">{SETTINGS[key].description}</div>
                    </div>
                ))}
            </div>
            {showModal && <NutritionWeightsModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
