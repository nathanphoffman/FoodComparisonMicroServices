'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { OverGatheringModal } from "../../Modals/OverGatheringModal";
import { DEFAULT_OVER_GATHERING } from "../FoodTableDefaults";


export function OverGatheringSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [value, setValue] = useState(DEFAULT_OVER_GATHERING);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setValue(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1 border-t border-neutral-200 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Over-Gathering Factor</span>
                <span className="font-medium text-neutral-700">{value.toFixed(1)}×</span>
            </div>
            <Slider min={1} max={5} step={0.5} value={value} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                divides the Improvement score of wild-gathered plants
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <OverGatheringModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
