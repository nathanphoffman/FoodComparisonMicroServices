'use client';

import { useState } from "react";
import { Slider } from "../Inputs/Slider";
import type { FoodWeights } from "./FoodTableTypes";

export type { FoodWeights };

const KEYS: (keyof FoodWeights)[] = ['calories', 'protein', 'mass'];

const LABELS: Record<keyof FoodWeights, string> = {
    calories: 'Calorie Weight',
    protein:  'Protein Weight',
    mass:     'Mass Weight',
};

const DEFAULT_FOOD_WEIGHTS: FoodWeights = { calories: 34, protein: 33, mass: 33 }
const DEFAULT_GREEN_WATER = 25;
const DEFAULT_GREY_WATER = 25;
const DEFAULT_PHILOSOPHICAL_KILL = 1;

export function FoodTableSliders({ onChange, onGreenWaterChange, onGreyWaterChange, onPhilosophicalKillChange }: { onChange?: (w: FoodWeights) => void; onGreenWaterChange?: (w: number) => void; onGreyWaterChange?: (w: number) => void; onPhilosophicalKillChange?: (v: number) => void }) {

    const [ weights, setWeights ]                     = useState<FoodWeights>(DEFAULT_FOOD_WEIGHTS);
    const [ greenWaterWeight, setGreenWater ]          = useState(DEFAULT_GREEN_WATER);
    const [ greyWaterWeight, setGreyWater ]            = useState(DEFAULT_GREY_WATER);
    const [ philosophicalKill, setPhilosophicalKill ]  = useState(DEFAULT_PHILOSOPHICAL_KILL);

    const splitEvenlyBetweenTwo = (
        updatedWeights: FoodWeights,
        otherKeys: (keyof FoodWeights)[],
        movedKeyNewValue: number,
    ) => {
        const TOTAL_PERCENTAGE = 100;
        const remainingBudget = TOTAL_PERCENTAGE - movedKeyNewValue;
        const firstHalf = Math.round(remainingBudget / 2);
        const secondHalf = remainingBudget - firstHalf;
        updatedWeights[otherKeys[0]] = firstHalf;
        updatedWeights[otherKeys[1]] = secondHalf;
    };

    const redistributeProportionally = (
        updatedWeights: FoodWeights,
        currentWeights: FoodWeights,
        otherKeys: (keyof FoodWeights)[],
        amountMoved: number,
        otherKeysTotal: number,
    ) => {
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
    };

    const handleWeightSliderChange = (movedKey: keyof FoodWeights, newValue: number) => {
        setWeights(currentWeights => {
            const otherKeys = KEYS.filter(weightKey => weightKey !== movedKey);
            const otherKeysTotal = otherKeys.reduce((runningTotal, weightKey) => runningTotal + currentWeights[weightKey], 0);
            const amountMoved = newValue - currentWeights[movedKey];

            const updatedWeights = { ...currentWeights, [movedKey]: newValue } as FoodWeights;

            if (otherKeysTotal === 0) {
                splitEvenlyBetweenTwo(updatedWeights, otherKeys, newValue);
            } else {
                redistributeProportionally(updatedWeights, currentWeights, otherKeys, amountMoved, otherKeysTotal);
            }

            onChange?.(updatedWeights);
            return updatedWeights;
        });
    };

    const handleGreenWater = (val: number) => {
        setGreenWater(val);
        onGreenWaterChange?.(val);
    };

    const handleGreyWater = (val: number) => {
        setGreyWater(val);
        onGreyWaterChange?.(val);
    };

    const handlePhilosophicalKill = (val: number) => {
        setPhilosophicalKill(val);
        onPhilosophicalKillChange?.(val);
    };

    return <div className="flex gap-6 mb-4">
        {KEYS.map(key => (
            <div key={key} className="flex flex-col gap-1 flex-1">
                <div className="flex justify-between text-xs text-neutral-500">
                    <span>{LABELS[key]}</span>
                    <span className="font-medium text-neutral-700">{weights[key]}%</span>
                </div>
                <Slider min={0} max={100} value={weights[key]} onChange={v => handleWeightSliderChange(key, v)} />
            </div>
        ))}
        <div className="flex flex-col gap-1 flex-1 border-l border-neutral-200 pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Rain Water</span>
                <span className="font-medium text-neutral-700">{greenWaterWeight}%</span>
            </div>
            <Slider min={0} max={100} value={greenWaterWeight} onChange={handleGreenWater} />
            <div className="text-xs text-neutral-400 mt-0.5">how much green (rain) water counts</div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Pollution Water</span>
                <span className="font-medium text-neutral-700">{greyWaterWeight}%</span>
            </div>
            <Slider min={0} max={100} value={greyWaterWeight} onChange={handleGreyWater} />
            <div className="text-xs text-neutral-400 mt-0.5">how much grey (pollution) water counts</div>
        </div>
        <div className="flex flex-col gap-1 flex-1 border-l border-neutral-200 pl-6">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>Kill : Accident</span>
                <span className="font-medium text-neutral-700">{philosophicalKill}×</span>
            </div>
            <Slider min={1} max={10000} value={philosophicalKill} onChange={handlePhilosophicalKill} />
            <div className="text-xs text-neutral-400 mt-0.5">how much worse intentional killing is vs. accidental</div>
        </div>
    </div>
}
