import type { ColConfig } from './FoodTableTypes';

/** Column headers that depend on the Compare By unit and the reference food. */
export function dynamicLabels(unit: string, referenceName: string): Partial<Record<ColConfig['key'], string>> {
    return {
        emissions:        `CO₂e (kg / ${unit})`,
        landUse:          `Land Use (m² / ${unit})`,
        directKill:       `Direct Kill / ${unit}`,
        water:            `Water (L / ${unit})`,
        captiveSentience: `Captive Sentience Cost / ${unit}`,
        sentientHarm:     `Sentient Harm / ${unit}`,
        finalScore:       `Improvement over ${referenceName}`,
    };
}
