import type { RawFood } from '@/lib/queries/commonFoods';
import type { FoodWeights, IntelligenceDetail, NutritionDetail } from './FoodTableTypes';

// ── Display-only constants ────────────────────────────────────────────────────

export const ONE_MILLION    = 1_000_000;
export const ONE_BILLION    = 1_000_000_000;
export const ONE_TRILLION   = 1e12;
const        ONE_THOUSAND   = 1_000;
const        ONE_QUADRILLION = 1e15;

// ── Formatters (no math, display only) ───────────────────────────────────────

export function formatNeurons(neuronCount: number): string {
    if (neuronCount >= ONE_BILLION)  return `${(neuronCount / ONE_BILLION).toFixed(0)}B`;
    if (neuronCount >= ONE_MILLION)  return `${(neuronCount / ONE_MILLION).toFixed(0)}M`;
    if (neuronCount >= ONE_THOUSAND) return `${(neuronCount / ONE_THOUSAND).toFixed(0)}K`;
    return String(neuronCount);
}

export function formatIntelligenceValue(value: number): string {
    if (value >= ONE_QUADRILLION) return `${(value / ONE_QUADRILLION).toFixed(1)}P`;
    if (value >= ONE_TRILLION)    return `${(value / ONE_TRILLION).toFixed(1)}T`;
    if (value >= ONE_BILLION)     return `${(value / ONE_BILLION).toFixed(1)}G`;
    if (value >= ONE_MILLION)     return `${(value / ONE_MILLION).toFixed(1)}M`;
    return value.toFixed(0);
}

export function nutritionScale(calories: number): number {
    return calories > 0 ? 100 / calories : 0;
}

export function getUnitLabel(weights: FoodWeights): string {
    if (weights.mass     === 100) return 'kg';
    if (weights.calories === 100) return '1000 kcal';
    if (weights.protein  === 100) return '100g protein';
    return 'weighted unit';
}

// ── RawFood field-mapping helpers (no computation) ───────────────────────────
// These exist so FoodTable.tsx doesn't need to inline field assignments for
// tooltip detail types that are pure passthroughs from the raw data.

export function toNutritionDetail(food: RawFood): NutritionDetail {
    return {
        calories:     food.calories,
        fat:          food.fat,
        saturatedFat: food.sat_fat,
        transFat:     food.trans_fat,
        cholesterol:  food.cholesterol,
        sodium:       food.sodium,
        carbs:        food.carbs,
        fiber:        food.fiber,
        sugar:        food.sugar,
        protein:      food.protein,
    };
}

export function toIntelligenceDetail(food: RawFood): IntelligenceDetail {
    return {
        neuronCount:   food.neuron_count ?? 0,
        weightKg:      food.weight_kg,
        yieldFraction: food.yield_fraction,
    };
}
