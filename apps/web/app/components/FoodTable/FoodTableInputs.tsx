'use client';

import { useState, useRef, useEffect } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import type { FoodWeights } from './FoodTableTypes';
import type { SortKey } from './FoodTableSort';

// ── Column config ─────────────────────────────────────────────────────────────

export type ColumnKey = SortKey | 'dummy';

export const COLUMN_CONFIG: { key: ColumnKey; label: string; sortKey?: SortKey; defaultVisible: boolean }[] = [
    { key: 'name',           label: 'Food',              sortKey: 'name',           defaultVisible: true  },
    { key: 'nutritionScore', label: 'Nutrition Score',   sortKey: 'nutritionScore', defaultVisible: true  },
    { key: 'emissions',      label: 'CO₂e (kg / kg)',    sortKey: 'emissions',      defaultVisible: true  },
    { key: 'landUse',        label: 'Land Use (m² / kg)', sortKey: 'landUse',       defaultVisible: true  },
    { key: 'directKill',     label: 'Direct Kill',        sortKey: 'directKill',    defaultVisible: true  },
    { key: 'water',          label: 'Water (L / kg)',     sortKey: 'water',          defaultVisible: true  },
    { key: 'ecoDestruction', label: 'Eco Destruction',    sortKey: 'ecoDestruction', defaultVisible: true  },
    { key: 'finalScore',     label: 'Final Score',        sortKey: 'finalScore',     defaultVisible: true  },
    { key: 'dummy',          label: 'Test Column',        sortKey: undefined,        defaultVisible: false },
];

export type ColConfig = (typeof COLUMN_CONFIG)[number];

// ── Slider values ─────────────────────────────────────────────────────────────

export type SliderValues = {
    weights:                    FoodWeights;
    greenWaterWeight:           number;
    greyWaterWeight:            number;
    killMultiplier:             number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
};

export const DEFAULT_SLIDER_VALUES: SliderValues = {
    weights:                    { calories: 34, protein: 33, mass: 33 },
    greenWaterWeight:           25,
    greyWaterWeight:            25,
    killMultiplier:             1,
    neuronExponent:             1.5,
    weightExponent:             0.75,
    finalIntelligenceExponent:  1.0,
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
    // All slider values flow up as a single combined object
    onSliderValuesChange: (v: SliderValues) => void;

    // Scoring error banner (non-blocking, dismissable)
    scoringError:          string | null;
    onDismissScoringError: () => void;

    // Column visibility — state lives here; parent notified synchronously on change
    onActiveColsChange: (cols: ColConfig[]) => void;
};

export function FoodTableInputs({
    onSliderValuesChange,
    scoringError,
    onDismissScoringError,
    onActiveColsChange,
}: Props) {
    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [visibleColumns, setVisible]    = useState<Set<ColumnKey>>(
        () => new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );
    const [showToggle, setShowToggle] = useState(false);
    const toggleRef                   = useRef<HTMLDivElement>(null);

    function handleWeights(weights: FoodWeights) {
        const next = { ...sliderValues, weights };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleGreenWater(greenWaterWeight: number) {
        const next = { ...sliderValues, greenWaterWeight };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleGreyWater(greyWaterWeight: number) {
        const next = { ...sliderValues, greyWaterWeight };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleKillMultiplier(killMultiplier: number) {
        const next = { ...sliderValues, killMultiplier };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleNeuronExponent(neuronExponent: number) {
        const next = { ...sliderValues, neuronExponent };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleWeightExponent(weightExponent: number) {
        const next = { ...sliderValues, weightExponent };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleFinalIntelligenceExponent(finalIntelligenceExponent: number) {
        const next = { ...sliderValues, finalIntelligenceExponent };
        setSliderValues(next);
        onSliderValuesChange(next);
    }

    function handleToggle(key: ColumnKey) {
        const next = new Set(visibleColumns);
        next.has(key) ? next.delete(key) : next.add(key);
        setVisible(next);
        onActiveColsChange(COLUMN_CONFIG.filter(c => next.has(c.key)));
    }

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (toggleRef.current && !toggleRef.current.contains(e.target as Node)) {
                setShowToggle(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <>
            <FoodTableSliders
                onChange={handleWeights}
                onGreenWaterChange={handleGreenWater}
                onGreyWaterChange={handleGreyWater}
                onPhilosophicalKillChange={handleKillMultiplier}
                onNeuronExponentChange={handleNeuronExponent}
                onWeightExponentChange={handleWeightExponent}
                onFinalIntelligenceExponentChange={handleFinalIntelligenceExponent}
            />
            {scoringError && (
                <div className="flex items-start justify-between gap-3 mb-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                    <div>
                        <span className="font-medium">Scoring error — </span>
                        scores may be stale. {scoringError}
                    </div>
                    <button
                        onClick={onDismissScoringError}
                        className="shrink-0 text-red-400 hover:text-red-600 leading-none text-base"
                        aria-label="Dismiss"
                    >✕</button>
                </div>
            )}
            <div className="flex justify-end mb-2" ref={toggleRef}>
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
                                        onChange={() => handleToggle(col.key)}
                                        className="accent-neutral-700"
                                    />
                                    {col.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
