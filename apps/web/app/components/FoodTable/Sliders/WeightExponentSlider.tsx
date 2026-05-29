'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

const DEFAULT_WEIGHT_EXPONENT = 0.75;

export function WeightExponentSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [weightExponent, setWeightExponent] = useState(DEFAULT_WEIGHT_EXPONENT);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setWeightExponent(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Weight Exponent</span>
                <span className="font-medium text-neutral-700">{weightExponent.toFixed(2)}</span>
            </div>
            <Slider min={0.1} max={2} step={0.05} value={weightExponent} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">exponent applied to body mass in intelligence calc</div>
        </div>
    );
}
