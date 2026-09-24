'use client';

import type { ScorePriorities } from "../FoodTableTypes";
import { PercentSliders } from "./PercentSliders";

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

// Equal weight for all six (rounded so they sum to 100).
export const DEFAULT_SCORE_PRIORITIES: ScorePriorities = {
    nutrition:    17,
    emissions:    17,
    intelligence: 17,
    water:        17,
    landUse:      16,
    availability: 16,
};

export function ScorePrioritySliders({ onChange }: { onChange?: (p: ScorePriorities) => void }) {
    return (
        <PercentSliders
            keys={KEYS}
            labels={LABELS}
            descriptions={DESCRIPTIONS}
            defaults={DEFAULT_SCORE_PRIORITIES}
            onChange={onChange}
        />
    );
}
