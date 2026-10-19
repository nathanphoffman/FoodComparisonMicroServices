import type { ColConfig } from '../types/FoodTableTypes';
import { COLUMN_CONFIG } from '../scoring/FoodTableDefaults';
import type { FigureKey } from '../FoodDetail/figures/FoodDetailFigures';

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

/** Every column's label, for the detail modal's tiles (it shows all figures, not only visible columns). */
export function figureLabelsFor(overrides: Partial<Record<ColConfig['key'], string>>): Record<FigureKey, string> {
    return Object.fromEntries(
        COLUMN_CONFIG.filter(column => column.key !== 'name' && column.key !== 'rank').map(column => [column.key, overrides[column.key] ?? column.label]),
    ) as Record<FigureKey, string>;
}
