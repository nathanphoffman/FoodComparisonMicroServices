'use client';

import { WeightSliders }                    from "./Sliders/percent/WeightSliders";
import { ScorePrioritySliders }             from "./Sliders/percent/ScorePrioritySliders";
import { ExpandableSliderGroup }            from "./Sliders/ExpandableSliderGroup";
import { LandTypeSliders }                  from "./Sliders/LandTypeSliders";
import { NutritionSliders }                 from "./Sliders/NutritionSliders";
import { IntelligenceSliders, WaterSliders, OpinionatedSliders } from "./Sliders/value/ValueSliderGroups";
import type { FoodWeights, ScorePriorities, SliderValues } from "../types/FoodTableTypes";

export type { FoodWeights };

/** Starting levels for the two slider groups whose positions aren't the same as their values (they're shares of a whole). */
export type PresetLevels = { foodWeights: FoodWeights; scorePriorities: ScorePriorities };

type Props = {
    /** Called with the name of the setting that moved and its new value. */
    onChange: <SliderKey extends keyof SliderValues>(key: SliderKey, value: SliderValues[SliderKey]) => void;

    /** The values the sliders start at. Changing `resetKey` remounts every slider so it picks them up again (used by presets). */
    values: SliderValues;
    presetLevels: PresetLevels;
    resetKey: number;
};

export function FoodTableSliders({ onChange, values, presetLevels, resetKey }: Props) {
    const set = <SliderKey extends keyof SliderValues>(key: SliderKey) => (value: SliderValues[SliderKey]) => onChange(key, value);
    const groupProps = { values, onChange, resetKey };

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
                <IntelligenceSliders {...groupProps} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <WaterSliders {...groupProps} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Land Use">
                <LandTypeSliders key={`LandTypeSliders-${resetKey}`} onChange={set('landTypeWeights')} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Opinionated">
                <OpinionatedSliders {...groupProps} />
            </ExpandableSliderGroup>
        </div>
    );
}
