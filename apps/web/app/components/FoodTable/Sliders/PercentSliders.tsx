'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

const TOTAL_PERCENTAGE = 100;

type Percentages<K extends string> = Record<K, number>;

// ── Redistribution helpers ────────────────────────────────────────────────────

// Keeps the group summing to 100 by spreading the moved slider's change over the
// others, in proportion to their current values (or evenly if they're all at 0).
function redistribute<K extends string>(
    keys: K[],
    current: Percentages<K>,
    movedKey: K,
    newValue: number,
): Percentages<K> {
    const otherKeys = keys.filter(key => key !== movedKey);
    const otherKeysTotal = otherKeys.reduce((runningTotal, key) => runningTotal + current[key], 0);
    const remainingBudget = TOTAL_PERCENTAGE - newValue;

    const updated: Percentages<K> = { ...current };
    updated[movedKey] = newValue;

    for (const key of otherKeys) {
        const share = otherKeysTotal === 0 ? 1 / otherKeys.length : current[key] / otherKeysTotal;
        updated[key] = Math.max(0, Math.round(remainingBudget * share));
    }

    const roundingDrift = keys.reduce((runningTotal, key) => runningTotal + updated[key], 0) - TOTAL_PERCENTAGE;
    if (roundingDrift !== 0) {
        const largestOtherKey = otherKeys.reduce((candidateKey, currentKey) => updated[candidateKey] >= updated[currentKey] ? candidateKey : currentKey);
        updated[largestOtherKey] = Math.max(0, updated[largestOtherKey] - roundingDrift);
    }

    return updated;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** A row of sliders that always add up to 100%. */
export function PercentSliders<K extends string>({
    keys,
    labels,
    descriptions,
    modals,
    defaults,
    onChange,
}: {
    keys: K[];
    labels: Record<K, string>;
    descriptions: Record<K, string>;
    modals?: Partial<Record<K, React.ComponentType<{ onClose: () => void }>>>;
    defaults: Percentages<K>;
    onChange?: (values: Percentages<K>) => void;
}) {
    const [values, setValues] = useState<Percentages<K>>(defaults);
    const [openModal, setOpenModal] = useState<K | null>(null);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleSliderChange = (movedKey: K, newValue: number) => {
        const updated = redistribute(keys, values, movedKey, newValue);
        // Local display updates instantly; parent (WASM re-score) is debounced.
        setValues(updated);
        debouncedOnChange(updated);
    };

    const ActiveModal: React.ComponentType<{ onClose: () => void }> | null | undefined = openModal ? modals?.[openModal] : null;

    return <>
        {keys.map(key => (
            <div key={key} className="flex flex-col gap-1 flex-1">
                <div className="flex justify-between text-xs text-neutral-500">
                    <span>{labels[key]}</span>
                    <span className="font-medium text-neutral-700">{values[key]}%</span>
                </div>
                <Slider min={0} max={100} value={values[key]} onChange={v => handleSliderChange(key, v)} />
                <div className="text-xs text-neutral-400 mt-0.5">
                    {descriptions[key]}
                    {modals?.[key] && (
                        <button onClick={() => setOpenModal(key)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
                    )}
                </div>
            </div>
        ))}
        {ActiveModal && <ActiveModal onClose={() => setOpenModal(null)} />}
    </>;
}
