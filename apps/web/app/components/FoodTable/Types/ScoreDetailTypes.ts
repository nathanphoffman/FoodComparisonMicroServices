import type { LandTypes } from './LandTypes';

export type EmissionsBreakdown = {
    co2:           number;
    ch4:           number;
    n2o:           number;
    feedEmissions?: number;
};

export type WaterDetail = {
    green: number | null;
    blue:  number | null;
    grey:  number | null;
};

export type LandUseDetail = {
    type:                        'plant' | 'animal';
    yieldKilogramsPerHectare:    number | null;
    pastureHectaresPerKilogram:  number | null;
    feedLandM2PerKg:             number | null;
    rawM2PerKg:                  number;            // area before the land type multiplier
    landTypes:                   LandTypes | null;  // this food's land split
    multiplier:                  number;            // weighted average of the Land Use sliders (1 = neutral)
};

export type IntelligenceDetail = {
    neuronCount:   number;
    weightKg:      number | null;
    yieldFraction: number | null;
};

// Per-animal facts behind direct kill and captivity (matches Rust KillDetail).
export type KillDetail = {
    outputKgPerDeath:        number;
    offspringDeaths:         number;
    captivityYears:          number;
    offspringCaptivityYears: number;
    intelligencePerDeath:    number;  // intelligence score of one death of this animal
    lifespanYears:           number;  // species lifespan used in that score
};

// How the Improvement score was built (matches Rust ImprovementDetail).
export type ImprovementTerm = {
    measure:    'nutrition' | 'emissions' | 'landUse' | 'water' | 'sentientHarm' | 'availability';
    ratio:      number;   // > 1 beats the reference
    priority:   number;   // priority slider share (0–100)
    zeroCapped: boolean;  // scored 0 here, so got the batch's best ratio × zero-better multiplier
};

export type ImprovementDetail = {
    terms:       ImprovementTerm[];
    exponent:    number;  // power-mean exponent: 1 average, 0 geometric, -1 harmonic
    mean:        number;  // before the wild penalty
    wildPenalty: number;  // Over-Hunting / Over-Gathering divisor (1 = none)
};

export type SentientHarmDetail = {
    directKillScore:           number;
    insectScore:               number;
    beeScore:                  number;
    wormScore:                 number;
    deforestationScore:        number;
    feedInsectScore:           number;
    feedBeeScore:              number;
    feedWormScore:             number;
    feedDeforestationScore:    number;
    pastureDeforestationScore: number;
    bycatchScore:              number;
    captiveSentienceScore:     number;
};

export const EMPTY_SENTIENT_HARM_DETAIL: SentientHarmDetail = {
    directKillScore: 0,
    insectScore: 0, beeScore: 0, wormScore: 0, deforestationScore: 0,
    feedInsectScore: 0, feedBeeScore: 0, feedWormScore: 0,
    feedDeforestationScore: 0, pastureDeforestationScore: 0, bycatchScore: 0,
    captiveSentienceScore: 0,
};
