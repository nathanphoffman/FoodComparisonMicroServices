'use client';

import { memo, useState, useEffect } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import { CustomFoodBuilder } from './CustomFoodBuilder';
import type { ColConfig, CustomFoodInput, DataRegion, SliderValues } from './FoodTableTypes';
import { CUSTOM_FOODS } from './FoodTableTypes';
import type { SortKey } from './FoodTableSort';
import { COLUMN_CONFIG, DEFAULT_SLIDER_VALUES } from './FoodTableDefaults';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FoodTablePresets, PRESETS, DEFAULT_PRESET_KEY } from './FoodTablePresets';
import type { Preset } from './FoodTablePresets';
import type { DietSettings, NutrientStandard } from './FoodTableRda';
import { FoodTableToolbar } from './FoodTableToolbar';

type Props = {
    onSliderValuesChange: (v: SliderValues) => void;
    onCustomFoodChange:    (food: CustomFoodInput) => void;
    onDietSettingsChange:  (settings: DietSettings) => void;
    scoringError:          string | null;
    onDismissScoringError: () => void;
    onActiveColsChange: (cols: ColConfig[]) => void;
    foods: { slug: string; name: string; calories?: number }[];
    dataRegion: DataRegion;
    onDataRegionChange: (region: DataRegion) => void;
    nutrientStandard: NutrientStandard;
    onNutrientStandardChange: (standard: NutrientStandard) => void;
};

// Memoized so opening/closing the food detail modal doesn't re-render all the sliders
export const FoodTableInputs = memo(function FoodTableInputs({
    onSliderValuesChange,
    onCustomFoodChange,
    onDietSettingsChange,
    scoringError,
    onDismissScoringError,
    onActiveColsChange,
    foods,
    dataRegion,
    onDataRegionChange,
    nutrientStandard,
    onNutrientStandardChange,
}: Props) {
    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [visibleColumns, setVisible]    = useState<Set<SortKey>>(
        () => new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );
    const [showControls, setShowControls] = useState(false);
    const isMobile                        = useIsMobile();

    // On mobile, start with a short column list; users can add more via Columns.
    useEffect(() => {
        if (!isMobile) return;
        const mobileCols = COLUMN_CONFIG.filter(c => c.mobileVisible);
        setVisible(new Set(mobileCols.map(c => c.key)));
        onActiveColsChange(mobileCols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);

    // Presets reset the sliders by remounting them (sliderResetKey) with the
    // preset's values. Any manual change afterwards clears the highlight.
    const [activePreset, setActivePreset] = useState<string | null>(DEFAULT_PRESET_KEY);
    const [sliderResetKey, setSliderResetKey] = useState(0);
    const [scorePriorityLevels, setScorePriorityLevels] = useState(
        () => PRESETS.find(preset => preset.key === DEFAULT_PRESET_KEY)!.scorePriorityLevels
    );

    const [foodWeightLevels, setFoodWeightLevels] = useState(
        () => PRESETS.find(preset => preset.key === DEFAULT_PRESET_KEY)!.foodWeightLevels
    );

    function commit(next: SliderValues) {
        setSliderValues(next);
        onSliderValuesChange(next);
    }
    function commitManual(next: SliderValues) {
        setActivePreset(null);
        commit(next);
    }
    function handlePreset(preset: Preset) {
        commit({ ...DEFAULT_SLIDER_VALUES, ...preset.changes });
        setScorePriorityLevels(preset.scorePriorityLevels);
        setFoodWeightLevels(preset.foodWeightLevels);
        setSliderResetKey(key => key + 1);
        setActivePreset(preset.key);
    }

    // Sets one slider value by hand, which also clears the preset highlight.
    function update<K extends keyof SliderValues>(key: K, value: SliderValues[K]) {
        commitManual({ ...sliderValues, [key]: value });
    }

    function handleToggle(key: SortKey) {
        const next = new Set(visibleColumns);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setVisible(next);
        onActiveColsChange(COLUMN_CONFIG.filter(c => next.has(c.key)));
    }

    return (
        <>
            <FoodTablePresets selected={activePreset} onSelect={handlePreset} />
            <button
                onClick={() => setShowControls(v => !v)}
                className="md:hidden mb-3 w-full text-sm text-neutral-600 border border-neutral-200 rounded px-3 py-2 flex items-center justify-between bg-white"
            >
                Adjust scoring <span className="text-xs">{showControls ? '▴' : '▾'}</span>
            </button>
            <div className={showControls ? 'block' : 'hidden md:block'}>
                <FoodTableSliders
                    onChange={value => update('weights', value)}
                    onScorePrioritiesChange={value => update('scorePriorities', value)}
                    onGreenWaterChange={value => update('greenWaterWeight', value)}
                    onGreyWaterChange={value => update('greyWaterWeight', value)}
                    onPhilosophicalKillChange={value => update('killMultiplier', value)}
                    onCaptivityChange={value => update('captivityMultiplier', value)}
                    onNeuronExponentChange={value => update('neuronExponent', value)}
                    onWeightExponentChange={value => update('weightExponent', value)}
                    onFinalIntelligenceExponentChange={value => update('finalIntelligenceExponent', value)}
                    onZeroBetterMultiplierChange={value => update('zeroBetterMultiplier', value)}
                    onLandTypeWeightsChange={value => update('landTypeWeights', value)}
                    onNutritionWeightsChange={value => update('nutritionWeights', value)}
                    onWinDampeningChange={value => update('winDampening', value)}
                    onOverHuntingChange={value => update('overHuntingFactor', value)}
                    onOverGatheringChange={value => update('overGatheringFactor', value)}
                    resetKey={sliderResetKey}
                    foodWeightLevels={foodWeightLevels}
                    nutritionWeights={sliderValues.nutritionWeights}
                    scorePriorityLevels={scorePriorityLevels}
                    killMultiplier={sliderValues.killMultiplier}
                    captivityMultiplier={sliderValues.captivityMultiplier}
                    overHuntingFactor={sliderValues.overHuntingFactor}
                    neuronExponent={sliderValues.neuronExponent}
                    weightExponent={sliderValues.weightExponent}
                    finalIntelligenceExponent={sliderValues.finalIntelligenceExponent}
                />
                {CUSTOM_FOODS.map(custom => (
                    <div key={custom.slug} className="mb-4 px-1">
                        <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">{custom.heading}</p>
                        {/* Custom foods keep the preset highlight, unlike the sliders above. */}
                        <CustomFoodBuilder
                            slug={custom.slug}
                            name={custom.name}
                            storageKey={custom.storageKey}
                            foods={foods}
                            showCalories={custom.slug === 'your-diet'}
                            onSettingsChange={onDietSettingsChange}
                            onChange={onCustomFoodChange}
                        />
                    </div>
                ))}
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
            <FoodTableToolbar
                dataRegion={dataRegion}
                onDataRegionChange={onDataRegionChange}
                nutrientStandard={nutrientStandard}
                onNutrientStandardChange={onNutrientStandardChange}
                referenceSlug={sliderValues.referenceSlug}
                onReferenceSlugChange={slug => update('referenceSlug', slug)}
                foods={foods}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggle}
            />
        </>
    );
});
