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
import { IntelligenceExamples }             from "./Sliders/IntelligenceExamples";
import type { FoodWeights, ScorePriorities } from "./FoodTableTypes";

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
    neuronExponent: number;
    weightExponent: number;
    finalIntelligenceExponent: number;
}) {
    return (
        <div className="flex flex-col gap-3 mb-4">
            <ExpandableSliderGroup label="Compare By">
                <WeightSliders onChange={onChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Score Priorities">
                <ScorePrioritySliders onChange={onScorePrioritiesChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Intelligence">
                <div className="flex flex-col gap-3 w-full">
                    <IntelligenceExamples
                        neuronExponent={neuronExponent}
                        weightExponent={weightExponent}
                        finalIntelligenceExponent={finalIntelligenceExponent}
                    />
                    <div className="flex gap-6">
                        <NeuronExponentSlider onChange={onNeuronExponentChange} />
                        <WeightExponentSlider onChange={onWeightExponentChange} />
                        <FinalIntelligenceExponentSlider onChange={onFinalIntelligenceExponentChange} />
                        <PhilosophicalKillSlider onChange={onPhilosophicalKillChange} />
                        <CaptivitySlider onChange={onCaptivityChange} />
                        <ZeroBetterMultiplierSlider onChange={onZeroBetterMultiplierChange} />
                    </div>
                </div>
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <GreyWaterSlider onChange={onGreyWaterChange} />
                <GreenWaterSlider onChange={onGreenWaterChange} />
            </ExpandableSliderGroup>
        </div>
    );
}
