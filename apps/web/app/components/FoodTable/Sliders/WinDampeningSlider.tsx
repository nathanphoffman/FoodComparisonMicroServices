'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { WinDampeningModal } from "../../Modals/WinDampeningModal";

// 1 = geometric mean (the original behavior). Keep in sync with default_win_dampening() in Rust.
export const DEFAULT_WIN_DAMPENING = 1;

function describe(value: number): string {
    if (value === 0) return 'linear';
    if (value === 1) return 'default';
    return value < 1 ? 'weaker' : 'stronger';
}

export function WinDampeningSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [value, setValue] = useState(DEFAULT_WIN_DAMPENING);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setValue(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 md:max-w-sm">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Big-Win Dampening</span>
                <span className="font-medium text-neutral-700">{value.toFixed(1)} ({describe(value)})</span>
            </div>
            <Slider min={0} max={2} step={0.1} value={value} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                how much a huge advantage in one measure is shrunk when combining them
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <WinDampeningModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
