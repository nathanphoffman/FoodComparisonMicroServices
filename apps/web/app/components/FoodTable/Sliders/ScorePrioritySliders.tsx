'use client';

import type { ScorePriorities } from "../FoodTableTypes";
import { PercentSliders, equalLevels, toShares } from "./PercentSliders";

const KEYS: (keyof ScorePriorities)[] = ['nutrition', 'emissions', 'intelligence', 'water', 'landUse', 'availability'];

const LABELS: Record<keyof ScorePriorities, string> = {
    nutrition:    'Nutrition',
    emissions:    'CO₂',
    intelligence: 'Intelligence',
    water:        'Water',
    landUse:      'Land Use',
    availability: 'Availability',
};

const DESCRIPTIONS: Record<keyof ScorePriorities, string> = {
    nutrition:    'how much the nutrition score counts',
    emissions:    'how much greenhouse emissions count',
    intelligence: 'how much sentient harm counts',
    water:        'how much water use counts',
    landUse:      'how much land use counts',
    availability: 'how much global supply counts',
};

// Equal weight for all six.
export const DEFAULT_SCORE_PRIORITIES: ScorePriorities = toShares(equalLevels(KEYS));

export function ScorePrioritySliders({ onChange }: { onChange?: (p: ScorePriorities) => void }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            onChange={onChange}
        />
    );
}
