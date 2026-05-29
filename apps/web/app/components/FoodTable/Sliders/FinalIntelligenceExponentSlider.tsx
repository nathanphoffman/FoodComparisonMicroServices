'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

const DEFAULT_FINAL_INTELLIGENCE_EXPONENT = 1.0;

export function FinalIntelligenceExponentSlider({ onChange }: { onChange?: (v: number) => void }) {
    const [finalIntelligenceExponent, setFinalIntelligenceExponent] = useState(DEFAULT_FINAL_INTELLIGENCE_EXPONENT);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleChange = (val: number) => {
        setFinalIntelligenceExponent(val);
        debouncedOnChange(val);
    };

    return (
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Intelligence Curve</span>
                <span className="font-medium text-neutral-700">{finalIntelligenceExponent.toFixed(2)}</span>
            </div>
            <Slider min={1.0} max={1.5} step={0.01} value={finalIntelligenceExponent} onChange={handleChange} />
            <div className="text-xs text-neutral-400 mt-0.5">final nonlinear curve applied to overall intelligence score</div>
        </div>
    );
}
