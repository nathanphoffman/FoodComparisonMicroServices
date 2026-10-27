import type { SentientHarmDetail, EmissionsBreakdown, LandUseDetail, WaterDetail, KillDetail, ImprovementDetail } from './ScoreDetailTypes';

/**
 * One row returned by the WASM scorer. Field names match the Rust `ScoredRow` serialized as camelCase;
 * the nested detail types are camelCase too.
 */
export type ScoredRow = {
    slug:     string;
    name:     string;

    /** The source food's type, or "diet" for the diet row the scorer builds itself. */
    foodType: string;

    /** Compare By units in one kg of this food; 0 when the food has none of the unit. */
    divisor:  number;

    // Aggregate scores, per Compare By unit. null when the food can't be scored on that measure.
    nutritionScore:   number | null;
    emissions:        number | null;
    landUse:          number | null;
    water:            number | null;
    directKill:       number | null;
    captiveSentience: number | null;
    sentientHarm:     number | null;
    finalScore:       number | null;
    availability:     number | null;

    // Tooltip breakdown details
    emissionsBreakdown?:  EmissionsBreakdown;
    waterDetail:          WaterDetail;
    landUseDetail:        LandUseDetail;
    sentientHarmDetail:   SentientHarmDetail;
    killDetail:           KillDetail | null;

    /** Wild fish killed per kg for fishmeal / fish oil; null if none. */
    wildFishDeathsPerKg:  number | null;

    /** Intelligence-weighted kill of those fish, per kg (part of direct kill). */
    wildFishKill:         number;

    /** How finalScore was built; null when finalScore is null or 0 by default. */
    improvementDetail:    ImprovementDetail | null;
};
