import type { SortKey } from '../scoring/FoodTableSort';
import type { LandTypes } from './LandTypes';
import type { NutritionWeights } from './NutrientTypes';

export type FoodWeights = {
    calories: number;
    protein:  number;
    dryMass:  number;
    wetMass:  number;
};

// How much each measure counts toward the Improvement score (sums to 100).
export type ScorePriorities = {
    nutrition:    number;
    emissions:    number;
    intelligence: number;
    water:        number;
    landUse:      number;
    availability: number;
};

export type ColConfig = { key: SortKey; label: string; defaultVisible: boolean; mobileVisible: boolean };

export type DataRegion = 'world' | 'us' | 'avg';

export type SliderValues = {
    weights:                    FoodWeights;
    scorePriorities:            ScorePriorities;
    greenWaterWeight:           number;
    greyWaterWeight:            number;
    killMultiplier:             number;
    captivityMultiplier:        number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
    zeroBetterMultiplier:       number;
    landTypeWeights:            LandTypes;
    nutritionWeights:           NutritionWeights;
    winDampening:               number;
    overHuntingFactor:          number;
    overGatheringFactor:        number;
    referenceSlug:              string;
};
