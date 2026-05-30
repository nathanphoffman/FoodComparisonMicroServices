'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { WeightExponentModal } from "../../Modals/WeightExponentModal";

const DEFAULT_WEIGHT_EXPONENT = 0.75;

export function WeightExponentSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [weightExponent, setWeightExponent] = useState(DEFAULT_WEIGHT_EXPONENT);
    const [showModal, setShowModal] = useState(false);

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
            <div className="text-xs text-neutral-400 mt-0.5">
                exponent applied to body mass in intelligence calc
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <WeightExponentModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
