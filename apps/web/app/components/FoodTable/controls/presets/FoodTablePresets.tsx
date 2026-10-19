'use client';

import { PRESETS, type Preset } from './FoodTablePresetData';

/** The row of preset buttons, and what the chosen preset changes from the defaults. */
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
