'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";

export const MAX_LEVEL = 10;
export const DEFAULT_LEVEL = MAX_LEVEL / 2;

type Levels<K extends string> = Record<K, number>;

/** Every key at the same level — i.e. equal shares. */
export function equalLevels<K extends string>(keys: K[]): Levels<K> {
    return Object.fromEntries(keys.map(key => [key, DEFAULT_LEVEL])) as Levels<K>;
}

/**
 * Turns independent "how much do I care" levels into percentages that sum to 100.
 * Only the ratios matter: levels of 10 and 5 become 67% and 33%.
 * If everything is at 0 ("Don't Care"), every share is 0.
 */
export function toShares<K extends string>(levels: Levels<K>): Levels<K> {
    const keys = Object.keys(levels) as K[];
    const total = keys.reduce((runningTotal, key) => runningTotal + levels[key], 0);
    return Object.fromEntries(
        keys.map(key => [key, total > 0 ? (levels[key] / total) * 100 : 0])
    ) as Levels<K>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A row of independent sliders from "Don't Care" to "Care The Most".
 * Each slider moves on its own; the resulting percentage share is shown per
 * slider and passed to onChange (always summing to 100, or all 0).
 */
export function PercentSliders<K extends string>({
    keys,
    labels,
    descriptions,
    modals,
    defaultLevels,
    onChange,
}: {
    keys: K[];
    labels: Record<K, string>;
    descriptions: Record<K, string>;
    modals?: Partial<Record<K, React.ComponentType<{ onClose: () => void }>>>;
    /** Starting slider levels (0–MAX_LEVEL); equal when omitted. */
    defaultLevels?: Levels<K>;
    onChange?: (shares: Levels<K>) => void;
}) {
    const [levels, setLevels] = useState<Levels<K>>(() => defaultLevels ?? equalLevels(keys));
    const [openModal, setOpenModal] = useState<K | null>(null);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const shares = toShares(levels);

    const handleSliderChange = (movedKey: K, newLevel: number) => {
        const updated: Levels<K> = { ...levels };
        updated[movedKey] = newLevel;
        // Local display updates instantly; parent (WASM re-score) is debounced.
        setLevels(updated);
        debouncedOnChange(toShares(updated));
    };

    const handleBalance = () => {
        const balanced = equalLevels(keys);
        setLevels(balanced);
        debouncedOnChange(toShares(balanced));
    };

    const ActiveModal: React.ComponentType<{ onClose: () => void }> | null | undefined = openModal ? modals?.[openModal] : null;

    return <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-start">
            <button onClick={handleBalance} className="text-xs text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">Balance Sliders</button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {keys.map(key => (
                <div key={key} className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                        <span>{labels[key]}</span>
                        <span className="font-medium text-neutral-700">{Math.round(shares[key])}%</span>
                    </div>
                    <Slider min={0} max={MAX_LEVEL} step={1} value={levels[key]} onChange={v => handleSliderChange(key, v)} />
                    <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Don&apos;t Care</span>
                        <span>Care The Most</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                        {descriptions[key]}
                        {modals?.[key] && (
                            <button onClick={() => setOpenModal(key)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
        {ActiveModal && <ActiveModal onClose={() => setOpenModal(null)} />}
    </div>;
}
