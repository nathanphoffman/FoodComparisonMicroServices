'use client';

import { WeightSliders }                    from "./Sliders/WeightSliders";
import { GreenWaterSlider }                 from "./Sliders/GreenWaterSlider";
import { GreyWaterSlider }                  from "./Sliders/GreyWaterSlider";
import { PhilosophicalKillSlider }          from "./Sliders/PhilosophicalKillSlider";
import { NeuronExponentSlider }             from "./Sliders/NeuronExponentSlider";
import { WeightExponentSlider }             from "./Sliders/WeightExponentSlider";
import { FinalIntelligenceExponentSlider }  from "./Sliders/FinalIntelligenceExponentSlider";
import { ExpandableSliderGroup }            from "./Sliders/ExpandableSliderGroup";
import type { FoodWeights }                 from "./FoodTableTypes";

export type { FoodWeights };

export function FoodTableSliders({
    onChange,
    onGreenWaterChange,
    onGreyWaterChange,
    onPhilosophicalKillChange,
    onNeuronExponentChange,
    onWeightExponentChange,
    onFinalIntelligenceExponentChange,
}: {
    onChange?: (w: FoodWeights) => void;
    onGreenWaterChange?: (v: number) => void;
    onGreyWaterChange?: (v: number) => void;
    onPhilosophicalKillChange?: (v: number) => void;
    onNeuronExponentChange?: (v: number) => void;
    onWeightExponentChange?: (v: number) => void;
    onFinalIntelligenceExponentChange?: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-3 mb-4">
            <ExpandableSliderGroup label="Weight">
                <WeightSliders onChange={onChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Intelligence">
                <NeuronExponentSlider onChange={onNeuronExponentChange} />
                <WeightExponentSlider onChange={onWeightExponentChange} />
                <FinalIntelligenceExponentSlider onChange={onFinalIntelligenceExponentChange} />
                <PhilosophicalKillSlider onChange={onPhilosophicalKillChange} />
            </ExpandableSliderGroup>
            <ExpandableSliderGroup label="Water">
                <GreyWaterSlider onChange={onGreyWaterChange} />
                <GreenWaterSlider onChange={onGreenWaterChange} />
            </ExpandableSliderGroup>
        </div>
    );
}
