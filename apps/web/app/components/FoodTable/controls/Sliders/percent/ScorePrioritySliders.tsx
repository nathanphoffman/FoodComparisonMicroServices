'use client';

import type { ScorePriorities } from "../../../types/FoodTableTypes";
import { PercentSliders } from "./PercentSliders";

export const SCORE_PRIORITY_KEYS: (keyof ScorePriorities)[] = ['nutrition', 'emissions', 'sentientHarm', 'water', 'landUse', 'availability'];

export const SCORE_PRIORITY_LABELS: Record<keyof ScorePriorities, string> = {
    nutrition:    'Nutrition',
    emissions:    'CO₂',
    sentientHarm: 'Intelligence',
    water:        'Water',
    landUse:      'Land Use',
    availability: 'Availability',
};

const DESCRIPTIONS: Record<keyof ScorePriorities, string> = {
    nutrition:    'how much the nutrition score counts',
    emissions:    'how much greenhouse emissions count',
    sentientHarm: 'how much sentient harm counts',
    water:        'how much water use counts',
    landUse:      'how much land use counts',
    availability: 'how much global supply counts',
};

export function ScorePrioritySliders({ onChange, defaultLevels }: { onChange?: (p: ScorePriorities) => void; defaultLevels?: ScorePriorities }) {
    return (
        <PercentSliders
            keys={SCORE_PRIORITY_KEYS}
            labels={SCORE_PRIORITY_LABELS}
            descriptions={DESCRIPTIONS}
            defaultLevels={defaultLevels}
            onChange={onChange}
        />
    );
}
