'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

const DEFAULT_GREEN_WATER = 25;

export function GreenWaterSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [greenWaterWeight, setGreenWater] = useState(DEFAULT_GREEN_WATER);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setGreenWater(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1 border-l border-neutral-200 pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Rain Water</span>
                <span className="font-medium text-neutral-700">{greenWaterWeight}%</span>
            </div>
            <Slider min={0} max={100} value={greenWaterWeight} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">how much green (rain) water counts</div>
        </div>
    );
}
