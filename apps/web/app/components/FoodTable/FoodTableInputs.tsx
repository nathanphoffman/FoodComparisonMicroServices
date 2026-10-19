'use client';

import { memo, useState, useEffect } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import { CustomFoodSections } from './CustomFoodSections';
import { ScoringErrorBanner } from './ScoringErrorBanner';
import type { ColConfig, CustomFoodInput, DataRegion, SliderValues } from './FoodTableTypes';
import type { SortKey } from './FoodTableSort';
import { COLUMN_CONFIG, DEFAULT_SLIDER_VALUES } from './FoodTableDefaults';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FoodTablePresets } from './FoodTablePresets';
import { PRESETS, DEFAULT_PRESET_KEY } from './FoodTablePresetData';
import type { Preset } from './FoodTablePresetData';
import type { DietSettings, NutrientStandard } from './FoodTableRda';
import { FoodTableToolbar } from './FoodTableToolbar';

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
    const [visibleColumns, setVisibleColumns] = useState<Set<SortKey>>(
        () => new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );
    const [showControls, setShowControls] = useState(false);
    const isMobile                        = useIsMobile();

    // On mobile, start with a short column list; users can add more via Columns.
    useEffect(() => {
        if (!isMobile) return;
        const mobileCols = COLUMN_CONFIG.filter(c => c.mobileVisible);
        setVisibleColumns(new Set(mobileCols.map(c => c.key)));
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

    function toggleColumn(key: SortKey) {
        const next = new Set(visibleColumns);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setVisibleColumns(next);
        onActiveColsChange(COLUMN_CONFIG.filter(c => next.has(c.key)));
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
