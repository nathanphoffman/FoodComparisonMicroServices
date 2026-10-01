'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

/** Maps between the slider's position and the value it stands for (e.g. a log scale). */
export type SliderScale = {
    toValue:    (position: number) => number;
    toPosition: (value: number) => number;
};

/** Everything that describes one slider, apart from its current value. */
export type ValueSliderSettings = {
    label:       string;
    description: string;
    min:         number;
    max:         number;
    step?:       number;
    format:      (value: number) => string;
    Modal:       React.ComponentType<{ onClose: () => void }>;
    scale?:      SliderScale;   // when set, min/max/step are slider positions, not values
    divider?:    boolean;       // draws a line separating it from the slider before it
};

/** A single labelled slider with a "more info" modal. */
export function ValueSlider({
    label, description, min, max, step, format, Modal, scale, divider,
    initialValue, onChange,
}: ValueSliderSettings & {
    initialValue: number;
    onChange?: (value: number) => void;
}) {
    const [value, setValue] = useState(initialValue);
    const [showModal, setShowModal] = useState(false);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (position: number) => {
        const newValue = scale ? scale.toValue(position) : position;
        setValue(newValue);
        debouncedOnChange(newValue);
    };

    const dividerClasses = divider ? ' border-t border-neutral-200 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6' : '';

    return (
        <div className={`flex flex-col gap-1 flex-1${dividerClasses}`}>
            <div className="flex justify-between text-xs text-neutral-500">
                <span>{label}</span>
                <span className="font-medium text-neutral-700">{format(value)}</span>
            </div>
            <Slider min={min} max={max} step={step} value={scale ? scale.toPosition(value) : value} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">
                {description}
                <button onClick={() => setShowModal(true)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
            </div>
            {showModal && <Modal onClose={() => setShowModal(false)} />}
        </div>
    );
}
