'use client';

import { WeightSliders }                    from "./Sliders/WeightSliders";
import { GreenWaterSlider }                 from "./Sliders/GreenWaterSlider";
import { GreyWaterSlider }                  from "./Sliders/GreyWaterSlider";
import { PhilosophicalKillSlider }          from "./Sliders/PhilosophicalKillSlider";
import { NeuronExponentSlider }             from "./Sliders/NeuronExponentSlider";
import { WeightExponentSlider }             from "./Sliders/WeightExponentSlider";
import { FinalIntelligenceExponentSlider }  from "./Sliders/FinalIntelligenceExponentSlider";
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
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-6">
                <WeightSliders onChange={onChange} />
                <GreenWaterSlider onChange={onGreenWaterChange} />
                <GreyWaterSlider onChange={onGreyWaterChange} />
                <PhilosophicalKillSlider onChange={onPhilosophicalKillChange} />
            </div>
            <div className="flex gap-6 border-t border-neutral-100 pt-3">
                <div className="text-xs text-neutral-400 self-center whitespace-nowrap pr-2">Intelligence math</div>
                <NeuronExponentSlider onChange={onNeuronExponentChange} />
                <WeightExponentSlider onChange={onWeightExponentChange} />
                <FinalIntelligenceExponentSlider onChange={onFinalIntelligenceExponentChange} />
            </div>
        </div>
    );
}
