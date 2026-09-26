'use client';

import type { FoodWeights } from "../FoodTableTypes";
import { CalorieWeightModal } from "../../Modals/CalorieWeightModal";
import { ProteinWeightModal } from "../../Modals/ProteinWeightModal";
import { DryMassWeightModal } from "../../Modals/DryMassWeightModal";
import { WetMassWeightModal } from "../../Modals/WetMassWeightModal";
import { PercentSliders, toShares } from "./PercentSliders";

const KEYS: (keyof FoodWeights)[] = ['calories', 'protein', 'dryMass', 'wetMass'];

const LABELS: Record<keyof FoodWeights, string> = {
    calories: 'Calorie Weight',
    protein:  'Protein Weight',
    dryMass:  'Dry Mass Weight',
    wetMass:  'Wet Mass Weight',
};

const DESCRIPTIONS: Record<keyof FoodWeights, string> = {
    calories: 'how much caloric density contributes to the score',
    protein:  'how much protein density contributes to the score',
    dryMass:  'how much food weight without water contributes to the score',
    wetMass:  'how much food weight as eaten (beans and grains cooked) contributes to the score',
};

const MODALS: Record<keyof FoodWeights, React.ComponentType<{ onClose: () => void }>> = {
    calories: CalorieWeightModal,
    protein:  ProteinWeightModal,
    dryMass:  DryMassWeightModal,
    wetMass:  WetMassWeightModal,
};

// Levels out of 10; shares come out to 50% calories, 20% protein, 20% dry mass, 10% wet mass.
const DEFAULT_LEVELS: FoodWeights = { calories: 5, protein: 2, dryMass: 2, wetMass: 1 };

export const DEFAULT_FOOD_WEIGHTS: FoodWeights = toShares(DEFAULT_LEVELS);

export function WeightSliders({ onChange }: { onChange?: (w: FoodWeights) => void }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            modals={MODALS}
            defaultLevels={DEFAULT_LEVELS}
            onChange={onChange}
        />
    );
}
