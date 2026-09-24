'use client';

import { useState, useRef, useEffect } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import { MealBuilder } from './MealBuilder';
import type { MealIngredient } from './MealBuilder';
import type { FoodWeights, ScorePriorities } from './FoodTableTypes';
import { DEFAULT_FOOD_WEIGHTS } from './Sliders/WeightSliders';
import { DEFAULT_SCORE_PRIORITIES } from './Sliders/ScorePrioritySliders';
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
    { key: 'captiveSentience', label: 'Captive Sentience Cost', sortKey: 'captiveSentience', defaultVisible: true },
    { key: 'sentientHarm',   label: 'Sentient Harm',      sortKey: 'sentientHarm',   defaultVisible: true  },
    { key: 'availability',   label: 'Availability (Gg)',  sortKey: 'availability',   defaultVisible: true  },
    { key: 'finalScore',     label: 'Improvement',        sortKey: 'finalScore',     defaultVisible: true  },
    { key: 'dummy',          label: 'Test Column',        sortKey: undefined,        defaultVisible: false },
];

export type ColConfig = (typeof COLUMN_CONFIG)[number];

// ── Slider values ─────────────────────────────────────────────────────────────

export type SliderValues = {
    weights:                    FoodWeights;
    scorePriorities:            ScorePriorities;
    greenWaterWeight:           number;
    greyWaterWeight:            number;
    killMultiplier:             number;
    captivityMultiplier:        number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
    zeroBetterMultiplier:       number;
    referenceSlug:              string;
    mealIngredients:            MealIngredient[];
};

export const DEFAULT_SLIDER_VALUES: SliderValues = {
    weights:                    DEFAULT_FOOD_WEIGHTS,
    scorePriorities:            DEFAULT_SCORE_PRIORITIES,
    greenWaterWeight:           25,
    greyWaterWeight:            25,
    killMultiplier:             500,
    captivityMultiplier:        1,
    neuronExponent:             1.5,
    weightExponent:             0.70,
    finalIntelligenceExponent:  1.15,
    zeroBetterMultiplier:       1.5,
    referenceSlug:              'peanuts',
    mealIngredients:            [],
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
    onSliderValuesChange: (v: SliderValues) => void;
    scoringError:          string | null;
    onDismissScoringError: () => void;
    onActiveColsChange: (cols: ColConfig[]) => void;
    foods: { slug: string; name: string }[];
};

export function FoodTableInputs({
    onSliderValuesChange,
    scoringError,
    onDismissScoringError,
    onActiveColsChange,
    foods,
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
    function handleScorePriorities(scorePriorities: ScorePriorities) {
        const next = { ...sliderValues, scorePriorities };
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
    function handleCaptivityMultiplier(captivityMultiplier: number) {
        const next = { ...sliderValues, captivityMultiplier };
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
    function handleZeroBetterMultiplier(zeroBetterMultiplier: number) {
        const next = { ...sliderValues, zeroBetterMultiplier };
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function handleMealChange(mealIngredients: MealIngredient[]) {
        const next = { ...sliderValues, mealIngredients };
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
                onScorePrioritiesChange={handleScorePriorities}
                onGreenWaterChange={handleGreenWater}
                onGreyWaterChange={handleGreyWater}
                onPhilosophicalKillChange={handleKillMultiplier}
                onCaptivityChange={handleCaptivityMultiplier}
                onNeuronExponentChange={handleNeuronExponent}
                onWeightExponentChange={handleWeightExponent}
                onFinalIntelligenceExponentChange={handleFinalIntelligenceExponent}
                onZeroBetterMultiplierChange={handleZeroBetterMultiplier}
                neuronExponent={sliderValues.neuronExponent}
                weightExponent={sliderValues.weightExponent}
                finalIntelligenceExponent={sliderValues.finalIntelligenceExponent}
            />
            <div className="mb-4 px-1">
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Custom Meal</p>
                <MealBuilder foods={foods} onChange={handleMealChange} />
            </div>
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
            <div className="flex justify-end items-center gap-3 mb-2" ref={toggleRef}>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>Compare vs.</span>
                    <select
                        value={sliderValues.referenceSlug}
                        onChange={e => {
                            const next = { ...sliderValues, referenceSlug: e.target.value };
                            setSliderValues(next);
                            onSliderValuesChange(next);
                        }}
                        className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white"
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
