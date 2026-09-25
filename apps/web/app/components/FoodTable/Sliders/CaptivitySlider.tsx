'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { CaptivityModal } from "../../Modals/CaptivityModal";

const DEFAULT_CAPTIVITY_MULTIPLIER = 1;

// Log scale: slider position 0–300 maps to 0.01×–10×.
const MIN_LOG = -2;
const POSITIONS_PER_DECADE = 100;
const toValue    = (pos: number) => Number(Math.pow(10, pos / POSITIONS_PER_DECADE + MIN_LOG).toPrecision(2));
const toPosition = (val: number) => (Math.log10(val) - MIN_LOG) * POSITIONS_PER_DECADE;

export function CaptivitySlider({ onChange }: { onChange?: (v: number) => void }) {
    const [captivityMultiplier, setCaptivityMultiplier] = useState(DEFAULT_CAPTIVITY_MULTIPLIER);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (pos: number) => {
        const val = toValue(pos);
        setCaptivityMultiplier(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1 border-t border-neutral-200 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Years in Captivity to Additional Deaths</span>
                <span className="font-medium text-neutral-700">{captivityMultiplier}×</span>
            </div>
            <Slider min={0} max={300} value={toPosition(captivityMultiplier)} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                how many extra deaths one year in captivity counts as
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <CaptivityModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
