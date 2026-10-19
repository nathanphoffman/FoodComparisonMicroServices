'use client';

import { memo, useState } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import { CustomFoodSections } from '../diet/CustomFoodSections';
import { ScoringErrorBanner } from './ScoringErrorBanner';
import type { ColConfig, CustomFoodInput, DataRegion, SliderValues } from '../types/FoodTableTypes';
import { DEFAULT_SLIDER_VALUES } from '../scoring/FoodTableDefaults';
import { useColumnVisibility } from './toolbar/useColumnVisibility';
import { FoodTablePresets } from './presets/FoodTablePresets';
import { PRESETS, DEFAULT_PRESET_KEY } from './presets/FoodTablePresetData';
import type { Preset } from './presets/FoodTablePresetData';
import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import { FoodTableToolbar } from './toolbar/FoodTableToolbar';

type Props = {
    onSliderValuesChange: (v: SliderValues) => void;
    onCustomFoodChange:    (food: CustomFoodInput) => void;
    onDietSettingsChange:  (settings: DietSettings) => void;
    onShowDiet:            () => void;
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
    onShowDiet,
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
    const { visibleColumns, toggleColumn } = useColumnVisibility(onActiveColsChange);
    const [showControls, setShowControls] = useState(false);

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
    function commitByHand(next: SliderValues) {
        setActivePreset(null);
        commit(next);
    }
    function applyPreset(preset: Preset) {
        commit({ ...DEFAULT_SLIDER_VALUES, ...preset.changes });
        setScorePriorityLevels(preset.scorePriorityLevels);
        setFoodWeightLevels(preset.foodWeightLevels);
        setSliderResetKey(key => key + 1);
        setActivePreset(preset.key);
    }

    // Sets one slider value by hand, which also clears the preset highlight.
    function setSlider<K extends keyof SliderValues>(key: K, value: SliderValues[K]) {
        commitByHand({ ...sliderValues, [key]: value });
    }

    return (
        <>
            <FoodTablePresets selected={activePreset} onSelect={applyPreset} />
            <button
                onClick={() => setShowControls(v => !v)}
                className="md:hidden mb-3 w-full text-sm text-neutral-600 border border-neutral-200 rounded px-3 py-2 flex items-center justify-between bg-white"
            >
                Adjust scoring <span className="text-xs">{showControls ? '▴' : '▾'}</span>
            </button>
            <div className={showControls ? 'block' : 'hidden md:block'}>
                <FoodTableSliders
                    onChange={value => setSlider('weights', value)}
                    onScorePrioritiesChange={value => setSlider('scorePriorities', value)}
                    onGreenWaterChange={value => setSlider('greenWaterWeight', value)}
                    onGreyWaterChange={value => setSlider('greyWaterWeight', value)}
                    onPhilosophicalKillChange={value => setSlider('killMultiplier', value)}
                    onCaptivityChange={value => setSlider('captivityMultiplier', value)}
                    onNeuronExponentChange={value => setSlider('neuronExponent', value)}
                    onWeightExponentChange={value => setSlider('weightExponent', value)}
                    onFinalIntelligenceExponentChange={value => setSlider('finalIntelligenceExponent', value)}
                    onZeroBetterMultiplierChange={value => setSlider('zeroBetterMultiplier', value)}
                    onLandTypeWeightsChange={value => setSlider('landTypeWeights', value)}
                    onNutritionWeightsChange={value => setSlider('nutritionWeights', value)}
                    onWinDampeningChange={value => setSlider('winDampening', value)}
                    onOverHuntingChange={value => setSlider('overHuntingFactor', value)}
                    onOverGatheringChange={value => setSlider('overGatheringFactor', value)}
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
                <CustomFoodSections
                    foods={foods}
                    nutrientStandard={nutrientStandard}
                    onShowDiet={onShowDiet}
                    onDietSettingsChange={onDietSettingsChange}
                    onCustomFoodChange={onCustomFoodChange}
                />
            </div>
            {scoringError && <ScoringErrorBanner message={scoringError} onDismiss={onDismissScoringError} />}
            <FoodTableToolbar
                dataRegion={dataRegion}
                onDataRegionChange={onDataRegionChange}
                nutrientStandard={nutrientStandard}
                onNutrientStandardChange={onNutrientStandardChange}
                referenceSlug={sliderValues.referenceSlug}
                onReferenceSlugChange={slug => setSlider('referenceSlug', slug)}
                foods={foods}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
            />
        </>
    );
});
