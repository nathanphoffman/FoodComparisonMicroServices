import type { RawFood } from '../Types/FoodTableTypes';
import type { ScoredRow } from '../scoring/FoodTableSort';
import type { FigureKey } from './FoodDetailFigures';
import type { MathStep, MathContext } from './math/MathShared';
import { nutritionScoreMath } from './math/nutritionMath';
import { emissionsMath, landUseMath, waterMath } from './math/environmentMath';
import { directKillMath, captiveSentienceMath, sentientHarmMath } from './math/harmMath';
import { availabilityMath, finalScoreMath } from './math/scoreMath';

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
