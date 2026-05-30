'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import { NeuronExponentModal } from "../../Modals/NeuronExponentModal";

const DEFAULT_NEURON_EXPONENT = 1.5;

export function NeuronExponentSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [neuronExponent, setNeuronExponent] = useState(DEFAULT_NEURON_EXPONENT);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setNeuronExponent(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Neuron Exponent</span>
                <span className="font-medium text-neutral-700">{neuronExponent.toFixed(2)}</span>
            </div>
            <Slider min={0.5} max={2} step={0.05} value={neuronExponent} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                exponent applied to neuron count in intelligence calc
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <NeuronExponentModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
