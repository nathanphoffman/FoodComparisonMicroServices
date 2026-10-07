'use client';

import type { ScorePriorities } from './FoodTableTypes';
import type { FoodWeights, NutritionWeights, SliderValues } from './FoodTableTypes';
import { toShares } from './Sliders/PercentSliders';
import { SCORE_PRIORITY_KEYS, SCORE_PRIORITY_LABELS } from './Sliders/ScorePrioritySliders';
import { DEFAULT_SCORE_PRIORITY_LEVELS, DEFAULT_FOOD_WEIGHT_LEVELS, DEFAULT_NUTRITION_WEIGHTS } from './FoodTableDefaults';
import { MAX_PHILOSOPHICAL_KILL, MAX_CAPTIVITY_MULTIPLIER, MAX_OVER_HUNTING } from './Sliders/ValueSliderSettings';

// A preset starts from the defaults and applies `changes` on top.
// Score priorities are stored as slider levels (0–MAX_LEVEL) so the sliders can
// be set to them; the percentages shown and scored come from toShares().
export type Preset = {
    key:                 string;
    label:               string;
    changes:             Partial<SliderValues>;
    scorePriorityLevels: ScorePriorities;
    // Levels for the Compare By sliders, same idea as scorePriorityLevels.
    foodWeightLevels:    FoodWeights;
    // Plain-English list of what the preset changes from the defaults.
    changeNotes:         string[];
};

// Nutrition and Intelligence at 30% each; the other four split the rest (10% each).
const PLANT_BASED_LEVELS: ScorePriorities = {
    nutrition: 9, intelligence: 9, emissions: 3, water: 3, landUse: 3, availability: 3,
};

// One preset's shape per focus: that priority gets a big share, the rest are split evenly.
const CLIMATE_LEVELS: ScorePriorities      = { emissions: 8, nutrition: 4, water: 4, landUse: 2, availability: 1, intelligence: 1 };
const WATER_LEVELS: ScorePriorities        = { water: 7, nutrition: 2, emissions: 2, landUse: 2, availability: 2, intelligence: 2 };
const NUTRITION_LEVELS: ScorePriorities    = { nutrition: 10, emissions: 2, water: 2, landUse: 2, availability: 2, intelligence: 2 };
const WILDLIFE_LAND_LEVELS: ScorePriorities = { landUse: 8, intelligence: 4, nutrition: 2, emissions: 2, water: 2, availability: 2 };
const AVAILABILITY_LEVELS: ScorePriorities = { availability: 6, nutrition: 2, emissions: 2, water: 2, landUse: 2, intelligence: 2 };
const CARNIVORE_FOOD_WEIGHT_LEVELS: FoodWeights = { calories: 4, protein: 6, dryMass: 1, wetMass: 1 };

const NUTRITION_MAX_WEIGHTS: NutritionWeights = {
    ...DEFAULT_NUTRITION_WEIGHTS,
    protein: 2, fiber: 3, micronutrients: 3, satFat: 3, freeSugar: 0.5, sodium: 3, proteinQuality: 1,
};
const CARNIVORE_NUTRITION_WEIGHTS: NutritionWeights = { ...DEFAULT_NUTRITION_WEIGHTS, protein: 3 };

function describePriorities(levels: ScorePriorities): string {
    const shares = toShares(levels);
    return 'Score Priorities: ' + SCORE_PRIORITY_KEYS
        .map(key => `${SCORE_PRIORITY_LABELS[key]} ${Math.round(shares[key])}%`)
        .join(', ');
}

export const PRESETS: Preset[] = [
    {
        key: 'default',
        label: 'Default',
        changes: {},
        scorePriorityLevels: DEFAULT_SCORE_PRIORITY_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [],
    },
    {
        key: 'plant-based',
        label: 'Plant-Based',
        changes: {
            scorePriorities:     toShares(PLANT_BASED_LEVELS),
            killMultiplier:      MAX_PHILOSOPHICAL_KILL,
            captivityMultiplier: MAX_CAPTIVITY_MULTIPLIER,
            overHuntingFactor:   MAX_OVER_HUNTING,
            referenceSlug:       'blueberries',
        },
        scorePriorityLevels: PLANT_BASED_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [
            describePriorities(PLANT_BASED_LEVELS),
            `Kill : Accident maxed (${MAX_PHILOSOPHICAL_KILL}×)`,
            `Years in Captivity maxed (${MAX_CAPTIVITY_MULTIPLIER}×)`,
            `Over-Hunting Factor maxed (${MAX_OVER_HUNTING.toFixed(1)}×)`,
            'Improvement compared vs. Blueberries',
        ],
    },
    {
        key: 'climate-first',
        label: 'Climate First',
        changes: { scorePriorities: toShares(CLIMATE_LEVELS) },
        scorePriorityLevels: CLIMATE_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [describePriorities(CLIMATE_LEVELS)],
    },
    {
        key: 'water-saver',
        label: 'Water Saver',
        changes: { scorePriorities: toShares(WATER_LEVELS) },
        scorePriorityLevels: WATER_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [describePriorities(WATER_LEVELS)],
    },
    {
        key: 'nutrition-max',
        label: 'Nutrition Max',
        changes: {
            scorePriorities:  toShares(NUTRITION_LEVELS),
            nutritionWeights: NUTRITION_MAX_WEIGHTS,
        },
        scorePriorityLevels: NUTRITION_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [
            describePriorities(NUTRITION_LEVELS),
            'Nutrition sliders raised: Protein 2, Fiber 3, Vitamins & Minerals 3, Saturated Fat 3, Free Sugar 0.5, Sodium 3',
        ],
    },
    {
        key: 'wildlife-and-land',
        label: 'Wildlife & Land',
        changes: {
            scorePriorities:   toShares(WILDLIFE_LAND_LEVELS),
            overHuntingFactor: 4,
        },
        scorePriorityLevels: WILDLIFE_LAND_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [
            describePriorities(WILDLIFE_LAND_LEVELS),
            'Over-Hunting Factor raised to 4.0×',
        ],
    },
    {
        key: 'availability',
        label: 'Availability',
        changes: { scorePriorities: toShares(AVAILABILITY_LEVELS) },
        scorePriorityLevels: AVAILABILITY_LEVELS,
        foodWeightLevels:    DEFAULT_FOOD_WEIGHT_LEVELS,
        changeNotes: [describePriorities(AVAILABILITY_LEVELS)],
    },
    {
        key: 'carnivore',
        label: 'Carnivore',
        changes: {
            weights:             toShares(CARNIVORE_FOOD_WEIGHT_LEVELS),
            nutritionWeights:    CARNIVORE_NUTRITION_WEIGHTS,
            killMultiplier:      100,
            captivityMultiplier: 0.1,
        },
        scorePriorityLevels: DEFAULT_SCORE_PRIORITY_LEVELS,
        foodWeightLevels:    CARNIVORE_FOOD_WEIGHT_LEVELS,
        changeNotes: [
            'Compare By: Calories 4, Protein 6, Dry Mass 1, Wet Mass 1 (protein counts more)',
            'Nutrition: Protein 3 pts / g',
            'Kill : Accident lowered to 100×',
            'Years in Captivity lowered to 0.1×',
        ],
    },
];

export const DEFAULT_PRESET_KEY = 'default';

export function FoodTablePresets({ selected, onSelect }: { selected: string | null; onSelect: (preset: Preset) => void }) {
    const active = PRESETS.find(preset => preset.key === selected);
    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide mr-1">Presets</span>
                {PRESETS.map(preset => {
                    const isActive = preset.key === selected;
                    return (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => onSelect(preset)}
                            aria-pressed={isActive}
                            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                                isActive
                                    ? 'bg-neutral-800 border-neutral-800 text-white'
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-800'
                            }`}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>
            {active && (
                <p className="text-xs text-neutral-500 mt-2">
                    {active.changeNotes.length === 0
                        ? 'Set everything to defaults.'
                        : <>Set to defaults with:</>}
                </p>
            )}
            {active && active.changeNotes.length > 0 && (
                <ul className="text-xs text-neutral-500 mt-1 list-disc pl-5">
                    {active.changeNotes.map(note => <li key={note}>{note}</li>)}
                </ul>
            )}
        </div>
    );
}
