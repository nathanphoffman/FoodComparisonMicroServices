'use client';

import { WeightSliders }           from "./Sliders/WeightSliders";
import { GreenWaterSlider }        from "./Sliders/GreenWaterSlider";
import { GreyWaterSlider }         from "./Sliders/GreyWaterSlider";
import { PhilosophicalKillSlider } from "./Sliders/PhilosophicalKillSlider";
import type { FoodWeights }        from "./FoodTableTypes";

export type { FoodWeights };

export function FoodTableSliders({ onChange, onGreenWaterChange, onGreyWaterChange, onPhilosophicalKillChange }: {
    onChange?: (w: FoodWeights) => void;
    onGreenWaterChange?: (v: number) => void;
    onGreyWaterChange?: (v: number) => void;
    onPhilosophicalKillChange?: (v: number) => void;
}) {
    return (
        <div className="flex gap-6 mb-4">
            <WeightSliders onChange={onChange} />
            <GreenWaterSlider onChange={onGreenWaterChange} />
            <GreyWaterSlider onChange={onGreyWaterChange} />
            <PhilosophicalKillSlider onChange={onPhilosophicalKillChange} />
        </div>
    );
}
