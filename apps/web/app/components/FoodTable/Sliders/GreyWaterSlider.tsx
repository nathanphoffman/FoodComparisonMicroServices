'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { GreyWaterModal } from "../../Modals/GreyWaterModal";

const DEFAULT_GREY_WATER = 25;

export function GreyWaterSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [greyWaterWeight, setGreyWater] = useState(DEFAULT_GREY_WATER);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setGreyWater(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Pollution Water</span>
                <span className="font-medium text-neutral-700">{greyWaterWeight}%</span>
            </div>
            <Slider min={0} max={100} value={greyWaterWeight} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                how much grey (pollution) water counts
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <GreyWaterModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
