'use client';

import { WeightSliders }                    from "./Sliders/WeightSliders";
import { ScorePrioritySliders }             from "./Sliders/ScorePrioritySliders";
import { ExpandableSliderGroup }            from "./Sliders/ExpandableSliderGroup";
import { LandTypeSliders }                  from "./Sliders/LandTypeSliders";
import { IntelligenceExamples }             from "./Sliders/IntelligenceExamples";
import { ValueSlider }                      from "./Sliders/ValueSlider";
import * as SLIDERS                         from "./Sliders/ValueSliderSettings";
import {
    DEFAULT_GREEN_WATER, DEFAULT_GREY_WATER, DEFAULT_NEURON_EXPONENT, DEFAULT_WEIGHT_EXPONENT,
    DEFAULT_FINAL_INTELLIGENCE_EXPONENT, DEFAULT_ZERO_BETTER_MULTIPLIER, DEFAULT_WIN_DAMPENING,
    DEFAULT_OVER_GATHERING,
} from "./FoodTableDefaults";
import type { FoodWeights, ScorePriorities } from "./FoodTableTypes";
import type { LandTypes } from "./FoodTableTypes";

export type { FoodWeights };

export function FoodTableSliders({
    onChange,
    onScorePrioritiesChange,
    onGreenWaterChange,
    onGreyWaterChange,
    onPhilosophicalKillChange,
    onCaptivityChange,
    onNeuronExponentChange,
    onWeightExponentChange,
    onFinalIntelligenceExponentChange,
    onZeroBetterMultiplierChange,
    onLandTypeWeightsChange,
    onWinDampeningChange,
    onOverHuntingChange,
    onOverGatheringChange,
    resetKey,
    scorePriorityLevels,
    killMultiplier,
    captivityMultiplier,
    overHuntingFactor,
    neuronExponent,
    weightExponent,
    finalIntelligenceExponent,
}: {
    onChange?: (w: FoodWeights) => void;
    onScorePrioritiesChange?: (p: ScorePriorities) => void;
    onGreenWaterChange?: (v: number) => void;
    onGreyWaterChange?: (v: number) => void;
    onPhilosophicalKillChange?: (v: number) => void;
    onCaptivityChange?: (v: number) => void;
    onNeuronExponentChange?: (v: number) => void;
    onWeightExponentChange?: (v: number) => void;
    onFinalIntelligenceExponentChange?: (v: number) => void;
    onZeroBetterMultiplierChange?: (v: number) => void;
    onLandTypeWeightsChange?: (w: LandTypes) => void;
    onWinDampeningChange?: (v: number) => void;
    onOverHuntingChange?: (v: number) => void;
    onOverGatheringChange?: (v: number) => void;
    // Changing resetKey remounts every slider so it picks up its starting value
    // again (used by presets). Sliders not listed here start at their defaults.
    resetKey: number;
    scorePriorityLevels: ScorePriorities;
    killMultiplier: number;
    captivityMultiplier: number;
    overHuntingFactor: number;
    neuronExponent: number;
    weightExponent: number;
    finalIntelligenceExponent: number;
}) {
    return (
        <div className="flex flex-col gap-3 mb-4">
            <ExpandableSliderGroup label="Compare By">
                <WeightSliders key={`WeightSliders-${resetKey}`} onChange={onChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Score Priorities">
                <ScorePrioritySliders key={`ScorePrioritySliders-${resetKey}`} onChange={onScorePrioritiesChange} defaultLevels={scorePriorityLevels} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Intelligence">
                <div className="flex flex-col gap-3 w-full">
                    <IntelligenceExamples
                        neuronExponent={neuronExponent}
                        weightExponent={weightExponent}
                        finalIntelligenceExponent={finalIntelligenceExponent}
                    />
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        <ValueSlider key={`NEURON_EXPONENT-${resetKey}`} {...SLIDERS.NEURON_EXPONENT} initialValue={DEFAULT_NEURON_EXPONENT} onChange={onNeuronExponentChange} />
                        <ValueSlider key={`WEIGHT_EXPONENT-${resetKey}`} {...SLIDERS.WEIGHT_EXPONENT} initialValue={DEFAULT_WEIGHT_EXPONENT} onChange={onWeightExponentChange} />
                        <ValueSlider key={`FINAL_INTELLIGENCE_EXPONENT-${resetKey}`} {...SLIDERS.FINAL_INTELLIGENCE_EXPONENT} initialValue={DEFAULT_FINAL_INTELLIGENCE_EXPONENT} onChange={onFinalIntelligenceExponentChange} />
                        <ValueSlider key={`PHILOSOPHICAL_KILL-${resetKey}`} {...SLIDERS.PHILOSOPHICAL_KILL} initialValue={killMultiplier} onChange={onPhilosophicalKillChange} />
                        <ValueSlider key={`CAPTIVITY-${resetKey}`} {...SLIDERS.CAPTIVITY} initialValue={captivityMultiplier} onChange={onCaptivityChange} />
                        <ValueSlider key={`ZERO_BETTER_MULTIPLIER-${resetKey}`} {...SLIDERS.ZERO_BETTER_MULTIPLIER} initialValue={DEFAULT_ZERO_BETTER_MULTIPLIER} onChange={onZeroBetterMultiplierChange} />
                    </div>
                </div>
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <ValueSlider key={`GREY_WATER-${resetKey}`} {...SLIDERS.GREY_WATER} initialValue={DEFAULT_GREY_WATER} onChange={onGreyWaterChange} />
                <ValueSlider key={`GREEN_WATER-${resetKey}`} {...SLIDERS.GREEN_WATER} initialValue={DEFAULT_GREEN_WATER} onChange={onGreenWaterChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Land Use">
                <LandTypeSliders key={`LandTypeSliders-${resetKey}`} onChange={onLandTypeWeightsChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Opinionated">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                    <ValueSlider key={`WIN_DAMPENING-${resetKey}`} {...SLIDERS.WIN_DAMPENING} initialValue={DEFAULT_WIN_DAMPENING} onChange={onWinDampeningChange} />
                    <ValueSlider key={`OVER_HUNTING-${resetKey}`} {...SLIDERS.OVER_HUNTING} initialValue={overHuntingFactor} onChange={onOverHuntingChange} />
                    <ValueSlider key={`OVER_GATHERING-${resetKey}`} {...SLIDERS.OVER_GATHERING} initialValue={DEFAULT_OVER_GATHERING} onChange={onOverGatheringChange} />
                </div>
            </ExpandableSliderGroup>
        </div>
    );
}
