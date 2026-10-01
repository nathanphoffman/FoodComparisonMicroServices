'use client';

import type { ScorePriorities } from './FoodTableTypes';
import type { SliderValues } from './FoodTableTypes';
import { toShares } from './Sliders/PercentSliders';
import { SCORE_PRIORITY_KEYS, SCORE_PRIORITY_LABELS } from './Sliders/ScorePrioritySliders';
import { DEFAULT_SCORE_PRIORITY_LEVELS } from './FoodTableDefaults';
import { MAX_PHILOSOPHICAL_KILL, MAX_CAPTIVITY_MULTIPLIER, MAX_OVER_HUNTING } from './Sliders/ValueSliderSettings';

// A preset starts from the defaults and applies `changes` on top.
// Score priorities are stored as slider levels (0–MAX_LEVEL) so the sliders can
// be set to them; the percentages shown and scored come from toShares().
export type Preset = {
    key:                 string;
    label:               string;
    changes:             Partial<SliderValues>;
    scorePriorityLevels: ScorePriorities;
    // Plain-English list of what the preset changes from the defaults.
    changeNotes:         string[];
};

// Nutrition and Intelligence at 30% each; the other four split the rest (10% each).
const PLANT_BASED_LEVELS: ScorePriorities = {
    nutrition: 9, intelligence: 9, emissions: 3, water: 3, landUse: 3, availability: 3,
};

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
        changeNotes: [
            describePriorities(PLANT_BASED_LEVELS),
            `Kill : Accident maxed (${MAX_PHILOSOPHICAL_KILL}×)`,
            `Years in Captivity maxed (${MAX_CAPTIVITY_MULTIPLIER}×)`,
            `Over-Hunting Factor maxed (${MAX_OVER_HUNTING.toFixed(1)}×)`,
            'Improvement compared vs. Blueberries',
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
