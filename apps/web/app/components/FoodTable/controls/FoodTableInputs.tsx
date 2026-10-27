'use client';

import { memo, useState } from 'react';
import { FoodTableSliders } from './FoodTableSliders';
import { DietSection } from '../diet/DietSection';
import { ScoringErrorBanner } from './ScoringErrorBanner';
import type { ColConfig, DietInput, SliderValues } from '../types/FoodTableTypes';
import { DEFAULT_SLIDER_VALUES } from '../scoring/FoodTableDefaults';
import { useColumnVisibility } from './toolbar/useColumnVisibility';
import { FoodTablePresets } from './presets/FoodTablePresets';
import { PRESETS, DEFAULT_PRESET_KEY } from './presets/FoodTablePresetData';
import type { Preset } from './presets/FoodTablePresetData';
import type { DietSettings } from '../nutrition/FoodTableRda';
import { FoodTableToolbar, type DataSettings } from './toolbar/FoodTableToolbar';

type Props = {
    foods: { slug: string; name: string; calories?: number }[];
    onSliderValuesChange: (values: SliderValues) => void;
    onActiveColsChange: (cols: ColConfig[]) => void;
    dataSettings: DataSettings;
    /** Everything the diet builder reports back: its food, its daily settings, and a request to show the breakdown. */
    diet: {
        onDietChange: (food: DietInput) => void;
        onSettingsChange: (settings: DietSettings) => void;
        onShow: () => void;
    };
    scoringError: { message: string; onDismiss: () => void } | null;
};

// Memoized so opening/closing the food detail modal doesn't re-render all the sliders
export const FoodTableInputs = memo(function FoodTableInputs({ foods, onSliderValuesChange, onActiveColsChange, dataSettings, diet, scoringError }: Props) {
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
    function setSlider<SliderKey extends keyof SliderValues>(key: SliderKey, value: SliderValues[SliderKey]) {
        commitByHand({ ...sliderValues, [key]: value });
    }

    return (
        <>
            <FoodTablePresets selected={activePreset} onSelect={applyPreset} />
            <button
                onClick={() => setShowControls(shown => !shown)}
                className="md:hidden mb-3 w-full text-sm text-neutral-600 border border-neutral-200 rounded px-3 py-2 flex items-center justify-between bg-white"
            >
                Adjust scoring <span className="text-xs">{showControls ? '▴' : '▾'}</span>
            </button>
            <div className={showControls ? 'block' : 'hidden md:block'}>
                <FoodTableSliders
                    onChange={setSlider}
                    values={sliderValues}
                    presetLevels={{ foodWeights: foodWeightLevels, scorePriorities: scorePriorityLevels }}
                    resetKey={sliderResetKey}
                />
                <DietSection
                    foods={foods}
                    options={{ standard: dataSettings.nutrientStandard, onShow: diet.onShow, onSettingsChange: diet.onSettingsChange }}
                    onDietChange={diet.onDietChange}
                />
            </div>
            {scoringError && <ScoringErrorBanner message={scoringError.message} onDismiss={scoringError.onDismiss} />}
            <FoodTableToolbar
                dataSettings={dataSettings}
                reference={{ slug: sliderValues.referenceSlug, onChange: slug => setSlider('referenceSlug', slug) }}
                foods={foods}
                columns={{ visible: visibleColumns, onToggle: toggleColumn }}
            />
        </>
    );
});
