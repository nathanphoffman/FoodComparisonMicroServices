import type { RawFood } from '../../../types/FoodTableTypes';
import type { ScoredRow } from '../../../types/FoodTableTypes';
import type { FigureKey } from '../FoodDetailFigures';
import type { MathStep, MathContext } from './MathShared';
import { nutritionScoreMath } from './nutritionMath';
import { emissionsMath, landUseMath, waterMath } from './environmentMath';
import { directKillMath, captiveSentienceMath, sentientHarmMath } from './harmMath';
import { availabilityMath, finalScoreMath } from './scoreMath';

export type { MathStep, MathContext };

/** Step-by-step working for one figure; [] when there is nothing to show. */
export function figureMath(key: FigureKey, food: RawFood, row: ScoredRow | undefined, context: MathContext): MathStep[] {
  if (!row) return [];
  switch (key) {
    case 'nutritionScore':    return nutritionScoreMath(food, row, context);
    case 'emissions':         return emissionsMath(food, row, context);
    case 'landUse':           return landUseMath(food, row, context);
    case 'water':             return waterMath(food, row, context);
    case 'directKill':        return directKillMath(food, row, context);
    case 'captiveSentience':  return captiveSentienceMath(food, row, context);
    case 'sentientHarm':      return sentientHarmMath(food, row, context);
    case 'availability':      return availabilityMath(food, row, context);
    case 'finalScore':        return finalScoreMath(food, row, context);
  }
}
