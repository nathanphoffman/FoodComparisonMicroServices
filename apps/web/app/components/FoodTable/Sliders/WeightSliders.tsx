'use client';

import type { FoodWeights } from "../FoodTableTypes";
import { CalorieWeightModal } from "../../Modals/CalorieWeightModal";
import { ProteinWeightModal } from "../../Modals/ProteinWeightModal";
import { MassWeightModal } from "../../Modals/MassWeightModal";
import { PercentSliders } from "./PercentSliders";

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

export const DEFAULT_FOOD_WEIGHTS: FoodWeights = { calories: 34, protein: 33, mass: 33 };

export function WeightSliders({ onChange }: { onChange?: (w: FoodWeights) => void }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            modals={MODALS}
            defaults={DEFAULT_FOOD_WEIGHTS}
            onChange={onChange}
        />
    );
}
