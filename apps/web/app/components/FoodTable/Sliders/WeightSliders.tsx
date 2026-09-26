'use client';

import type { FoodWeights } from "../FoodTableTypes";
import { CalorieWeightModal } from "../../Modals/CalorieWeightModal";
import { ProteinWeightModal } from "../../Modals/ProteinWeightModal";
import { DryMassWeightModal } from "../../Modals/DryMassWeightModal";
import { PercentSliders, equalLevels, toShares } from "./PercentSliders";

const KEYS: (keyof FoodWeights)[] = ['calories', 'protein', 'dryMass'];

const LABELS: Record<keyof FoodWeights, string> = {
    calories: 'Calorie Weight',
    protein:  'Protein Weight',
    dryMass:  'Dry Mass Weight',
};

const DESCRIPTIONS: Record<keyof FoodWeights, string> = {
    calories: 'how much caloric density contributes to the score',
    protein:  'how much protein density contributes to the score',
    dryMass:  'how much food weight without water contributes to the score',
};

const MODALS: Record<keyof FoodWeights, React.ComponentType<{ onClose: () => void }>> = {
    calories: CalorieWeightModal,
    protein:  ProteinWeightModal,
    dryMass:  DryMassWeightModal,
};

export const DEFAULT_FOOD_WEIGHTS: FoodWeights = toShares(equalLevels(KEYS));

export function WeightSliders({ onChange }: { onChange?: (w: FoodWeights) => void }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            modals={MODALS}
            onChange={onChange}
        />
    );
}
