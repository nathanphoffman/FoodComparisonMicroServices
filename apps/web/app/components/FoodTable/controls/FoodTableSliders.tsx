'use client';

import { WeightSliders }                    from "./Sliders/percent/WeightSliders";
import { ScorePrioritySliders }             from "./Sliders/percent/ScorePrioritySliders";
import { ExpandableSliderGroup }            from "./Sliders/ExpandableSliderGroup";
import { LandTypeSliders }                  from "./Sliders/LandTypeSliders";
import { NutritionSliders }                 from "./Sliders/NutritionSliders";
import { IntelligenceExamples }             from "./Sliders/IntelligenceExamples";
import { ValueSlider }                      from "./Sliders/value/ValueSlider";
import * as SLIDERS                         from "./Sliders/value/ValueSliderSettings";
import type { FoodWeights, ScorePriorities, SliderValues } from "../types/FoodTableTypes";

export type { FoodWeights };

/** Starting levels for the two slider groups whose positions aren't the same as their values (they're shares of a whole). */
export type PresetLevels = { foodWeights: FoodWeights; scorePriorities: ScorePriorities };

type Props = {
    /** Called with the name of the setting that moved and its new value. */
    onChange: <K extends keyof SliderValues>(key: K, value: SliderValues[K]) => void;
    /** The values the sliders start at. Changing `resetKey` remounts every slider so it picks them up again (used by presets). */
    values: SliderValues;
    presetLevels: PresetLevels;
    resetKey: number;
};

export function FoodTableSliders({ onChange, values, presetLevels, resetKey }: Props) {
    const set = <K extends keyof SliderValues>(key: K) => (value: SliderValues[K]) => onChange(key, value);
    return (
        <div className="flex flex-col gap-3 mb-4">
            <ExpandableSliderGroup label="Compare By">
                <WeightSliders key={`WeightSliders-${resetKey}`} onChange={set('weights')} defaultLevels={presetLevels.foodWeights} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Score Priorities">
                <ScorePrioritySliders key={`ScorePrioritySliders-${resetKey}`} onChange={set('scorePriorities')} defaultLevels={presetLevels.scorePriorities} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Nutrition">
                <NutritionSliders key={`NutritionSliders-${resetKey}`} onChange={set('nutritionWeights')} initialWeights={values.nutritionWeights} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Intelligence">
                <div className="flex flex-col gap-3 w-full">
                    <IntelligenceExamples
                        neuronExponent={values.neuronExponent}
                        weightExponent={values.weightExponent}
                        finalIntelligenceExponent={values.finalIntelligenceExponent}
                    />
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        <ValueSlider key={`NEURON_EXPONENT-${resetKey}`} {...SLIDERS.NEURON_EXPONENT} initialValue={values.neuronExponent} onChange={set('neuronExponent')} />
                        <ValueSlider key={`WEIGHT_EXPONENT-${resetKey}`} {...SLIDERS.WEIGHT_EXPONENT} initialValue={values.weightExponent} onChange={set('weightExponent')} />
                        <ValueSlider key={`FINAL_INTELLIGENCE_EXPONENT-${resetKey}`} {...SLIDERS.FINAL_INTELLIGENCE_EXPONENT} initialValue={values.finalIntelligenceExponent} onChange={set('finalIntelligenceExponent')} />
                        <ValueSlider key={`PHILOSOPHICAL_KILL-${resetKey}`} {...SLIDERS.PHILOSOPHICAL_KILL} initialValue={values.killMultiplier} onChange={set('killMultiplier')} />
                        <ValueSlider key={`CAPTIVITY-${resetKey}`} {...SLIDERS.CAPTIVITY} initialValue={values.captivityMultiplier} onChange={set('captivityMultiplier')} />
                    </div>
                </div>
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <ValueSlider key={`GREY_WATER-${resetKey}`} {...SLIDERS.GREY_WATER} initialValue={values.greyWaterWeight} onChange={set('greyWaterWeight')} />
                <ValueSlider key={`GREEN_WATER-${resetKey}`} {...SLIDERS.GREEN_WATER} initialValue={values.greenWaterWeight} onChange={set('greenWaterWeight')} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Land Use">
                <LandTypeSliders key={`LandTypeSliders-${resetKey}`} onChange={set('landTypeWeights')} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Opinionated">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                    <ValueSlider key={`WIN_DAMPENING-${resetKey}`} {...SLIDERS.WIN_DAMPENING} initialValue={values.winDampening} onChange={set('winDampening')} />
                    <ValueSlider key={`OVER_HUNTING-${resetKey}`} {...SLIDERS.OVER_HUNTING} initialValue={values.overHuntingFactor} onChange={set('overHuntingFactor')} />
                    <ValueSlider key={`OVER_GATHERING-${resetKey}`} {...SLIDERS.OVER_GATHERING} initialValue={values.overGatheringFactor} onChange={set('overGatheringFactor')} />
                    <ValueSlider key={`ZERO_BETTER_MULTIPLIER-${resetKey}`} {...SLIDERS.ZERO_BETTER_MULTIPLIER} initialValue={values.zeroBetterMultiplier} onChange={set('zeroBetterMultiplier')} />
                </div>
            </ExpandableSliderGroup>
        </div>
    );
}
