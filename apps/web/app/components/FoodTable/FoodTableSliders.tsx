'use client';

import { WeightSliders }                    from "./Sliders/WeightSliders";
import { ScorePrioritySliders }             from "./Sliders/ScorePrioritySliders";
import { GreenWaterSlider }                 from "./Sliders/GreenWaterSlider";
import { GreyWaterSlider }                  from "./Sliders/GreyWaterSlider";
import { PhilosophicalKillSlider }          from "./Sliders/PhilosophicalKillSlider";
import { CaptivitySlider }                  from "./Sliders/CaptivitySlider";
import { NeuronExponentSlider }             from "./Sliders/NeuronExponentSlider";
import { WeightExponentSlider }             from "./Sliders/WeightExponentSlider";
import { FinalIntelligenceExponentSlider }  from "./Sliders/FinalIntelligenceExponentSlider";
import { ZeroBetterMultiplierSlider }       from "./Sliders/ZeroBetterMultiplierSlider";
import { ExpandableSliderGroup }            from "./Sliders/ExpandableSliderGroup";
import { LandTypeSliders }                  from "./Sliders/LandTypeSliders";
import { WinDampeningSlider }               from "./Sliders/WinDampeningSlider";
import { OverHuntingSlider }                from "./Sliders/OverHuntingSlider";
import { OverGatheringSlider }              from "./Sliders/OverGatheringSlider";
import { IntelligenceExamples }             from "./Sliders/IntelligenceExamples";
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
                        <NeuronExponentSlider key={`NeuronExponentSlider-${resetKey}`} onChange={onNeuronExponentChange} />
                        <WeightExponentSlider key={`WeightExponentSlider-${resetKey}`} onChange={onWeightExponentChange} />
                        <FinalIntelligenceExponentSlider key={`FinalIntelligenceExponentSlider-${resetKey}`} onChange={onFinalIntelligenceExponentChange} />
                        <PhilosophicalKillSlider key={`PhilosophicalKillSlider-${resetKey}`} onChange={onPhilosophicalKillChange} initialValue={killMultiplier} />
                        <CaptivitySlider key={`CaptivitySlider-${resetKey}`} onChange={onCaptivityChange} initialValue={captivityMultiplier} />
                        <ZeroBetterMultiplierSlider key={`ZeroBetterMultiplierSlider-${resetKey}`} onChange={onZeroBetterMultiplierChange} />
                    </div>
                </div>
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <GreyWaterSlider key={`GreyWaterSlider-${resetKey}`} onChange={onGreyWaterChange} />
                <GreenWaterSlider key={`GreenWaterSlider-${resetKey}`} onChange={onGreenWaterChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Land Use">
                <LandTypeSliders key={`LandTypeSliders-${resetKey}`} onChange={onLandTypeWeightsChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Opinionated">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                    <WinDampeningSlider key={`WinDampeningSlider-${resetKey}`} onChange={onWinDampeningChange} />
                    <OverHuntingSlider key={`OverHuntingSlider-${resetKey}`} onChange={onOverHuntingChange} initialValue={overHuntingFactor} />
                    <OverGatheringSlider key={`OverGatheringSlider-${resetKey}`} onChange={onOverGatheringChange} />
                </div>
            </ExpandableSliderGroup>
        </div>
    );
}
