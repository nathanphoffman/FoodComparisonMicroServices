'use client';

import type { FoodWeights } from "../../../types/FoodTableTypes";
import type { HelpTopicKey } from "../../../../Modals/helpTopics";
import { PercentSliders } from "./PercentSliders";
import { DEFAULT_FOOD_WEIGHT_LEVELS } from "../../../scoring/FoodTableDefaults";

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

const HELP_TOPICS: Record<keyof FoodWeights, HelpTopicKey> = {
    calories: 'calorieWeight',
    protein:  'proteinWeight',
    dryMass:  'dryMassWeight',
    wetMass:  'wetMassWeight',
};

export function WeightSliders({ onChange, defaultLevels = DEFAULT_FOOD_WEIGHT_LEVELS }: { onChange?: (w: FoodWeights) => void; defaultLevels?: FoodWeights }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            helpTopics={HELP_TOPICS}
            defaultLevels={defaultLevels}
            onChange={onChange}
        />
    );
}
