'use client';

import { useState } from "react";
import { Slider } from "../../Inputs/Slider";
import { useDebouncedCallback, DEBOUNCE_MS } from "../../../hooks/useDebouncedCallback";
import type { FoodWeights } from "../FoodTableTypes";
import { CalorieWeightModal } from "../../Modals/CalorieWeightModal";
import { ProteinWeightModal } from "../../Modals/ProteinWeightModal";
import { MassWeightModal } from "../../Modals/MassWeightModal";

const KEYS: (keyof FoodWeights)[] = ['calories', 'protein', 'mass'];

const LABELS: Record<keyof FoodWeights, string> = {
    calories: 'Calorie Weight',
    protein:  'Protein Weight',
    mass:     'Mass Weight',
};

const DESCRIPTIONS: Record<keyof FoodWeights, string> = {
    calories: 'how much caloric density contributes to the score',
    protein:  'how much protein density contributes to the score',
    mass:     'how much raw mass contributes to the score',
};

const MODALS: Record<keyof FoodWeights, React.ComponentType<{ onClose: () => void }>> = {
    calories: CalorieWeightModal,
    protein:  ProteinWeightModal,
    mass:     MassWeightModal,
};

const DEFAULT_FOOD_WEIGHTS: FoodWeights = { calories: 34, protein: 33, mass: 33 };

// ── Weight redistribution helpers ─────────────────────────────────────────────

function splitEvenlyBetweenTwo(
    updatedWeights: FoodWeights,
    otherKeys: (keyof FoodWeights)[],
    movedKeyNewValue: number,
) {
    const TOTAL_PERCENTAGE = 100;
    const remainingBudget = TOTAL_PERCENTAGE - movedKeyNewValue;
    const firstHalf = Math.round(remainingBudget / 2);
    const secondHalf = remainingBudget - firstHalf;
    updatedWeights[otherKeys[0]] = firstHalf;
    updatedWeights[otherKeys[1]] = secondHalf;
}

function redistributeProportionally(
    updatedWeights: FoodWeights,
    currentWeights: FoodWeights,
    otherKeys: (keyof FoodWeights)[],
    amountMoved: number,
    otherKeysTotal: number,
) {
    const TOTAL_PERCENTAGE = 100;
    for (const weightKey of otherKeys) {
        const proportionalShare = currentWeights[weightKey] / otherKeysTotal;
        updatedWeights[weightKey] = Math.max(0, Math.round(currentWeights[weightKey] - amountMoved * proportionalShare));
    }
    const roundingDrift = KEYS.reduce((runningTotal, weightKey) => runningTotal + updatedWeights[weightKey], 0) - TOTAL_PERCENTAGE;
    if (roundingDrift !== 0) {
        const largestOtherKey = otherKeys.reduce((candidateKey, currentKey) => updatedWeights[candidateKey] >= updatedWeights[currentKey] ? candidateKey : currentKey);
        updatedWeights[largestOtherKey] = Math.max(0, updatedWeights[largestOtherKey] - roundingDrift);
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WeightSliders({ onChange }: { onChange?: (w: FoodWeights) => void }) {
    const [weights, setWeights] = useState<FoodWeights>(DEFAULT_FOOD_WEIGHTS);
    const [openModal, setOpenModal] = useState<keyof FoodWeights | null>(null);

    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    const handleWeightSliderChange = (movedKey: keyof FoodWeights, newValue: number) => {
        const otherKeys = KEYS.filter(weightKey => weightKey !== movedKey);
        const otherKeysTotal = otherKeys.reduce((runningTotal, weightKey) => runningTotal + weights[weightKey], 0);
        const amountMoved = newValue - weights[movedKey];

        const updatedWeights = { ...weights, [movedKey]: newValue } as FoodWeights;

        if (otherKeysTotal === 0) {
            splitEvenlyBetweenTwo(updatedWeights, otherKeys, newValue);
        } else {
            redistributeProportionally(updatedWeights, weights, otherKeys, amountMoved, otherKeysTotal);
        }

        // Local display updates instantly; parent (WASM re-score) is debounced.
        setWeights(updatedWeights);
        debouncedOnChange(updatedWeights);
    };

    const ActiveModal = openModal ? MODALS[openModal] : null;

    return <>
        {KEYS.map(key => (
            <div key={key} className="flex flex-col gap-1 flex-1">
                <div className="flex justify-between text-xs text-neutral-500">
                    <span>{LABELS[key]}</span>
                    <span className="font-medium text-neutral-700">{weights[key]}%</span>
                </div>
                <Slider min={0} max={100} value={weights[key]} onChange={v => handleWeightSliderChange(key, v)} />
                <div className="text-xs text-neutral-400 mt-0.5">
                    {DESCRIPTIONS[key]}
                    <button onClick={() => setOpenModal(key)} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
                </div>
            </div>
        ))}
        {ActiveModal && <ActiveModal onClose={() => setOpenModal(null)} />}
    </>;
}
