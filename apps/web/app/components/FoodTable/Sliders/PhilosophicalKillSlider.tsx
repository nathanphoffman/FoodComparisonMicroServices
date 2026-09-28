'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { PhilosophicalKillModal } from "../../Modals/PhilosophicalKillModal";

const DEFAULT_PHILOSOPHICAL_KILL = 500;
export const MAX_PHILOSOPHICAL_KILL = 1000;

export function PhilosophicalKillSlider({ onChange, initialValue = DEFAULT_PHILOSOPHICAL_KILL }: { onChange?: (v: number) => void; initialValue?: number }) {
    const [philosophicalKill, setPhilosophicalKill] = useState(initialValue);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setPhilosophicalKill(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1 border-t border-neutral-200 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Kill : Accident</span>
                <span className="font-medium text-neutral-700">{philosophicalKill}×</span>
            </div>
            <Slider min={0} max={MAX_PHILOSOPHICAL_KILL} value={philosophicalKill} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                how much worse intentional killing is vs. accidental
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <PhilosophicalKillModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
