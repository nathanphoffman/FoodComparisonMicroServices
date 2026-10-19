import { MICRONUTRIENT_KEYS, type RawFood } from '../../Types/FoodTableTypes';
import type { ScoredRow } from '../../scoring/FoodTableSort';
import { MICRONUTRIENT_INFO, aminoAcidProfile } from '../../nutrition/FoodTableCalculations';
import { num, pct, type MathStep, type MathContext } from './MathShared';

/** Working for the Nutrition Score: the points per 100 g, then per 100 kcal. */
export function nutritionScoreMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders } = context;
  if (row.nutrition_score == null || food.calories <= 0) return [];
  // Per 100 g so the numbers read like a label; same score as nutrition.rs's per-gram maths.
  const per100 = (perGram: number | null) => (perGram ?? 0) * 100;
  const protein = per100(food.protein);
  const fiber = per100(food.fiber);
  const satFat = per100(food.sat_fat);
  const sugar = per100(food.sugar);
  const sodiumMg = per100(food.sodium);
  const weights = sliders.nutritionWeights;
  const freeSugar = Math.max(0, sugar - weights.sugarAllowance * fiber);
  // Share of each vitamin/mineral's daily value in 100 g; missing ones add nothing.
  const dailyValueShares = MICRONUTRIENT_KEYS
    .filter(key => food.micronutrients?.[key] != null)
    .map(key => [key, per100(food.micronutrients![key]!) / MICRONUTRIENT_INFO[key].dailyValue] as const);
  const dailyValues = dailyValueShares.reduce((sum, [key, share]) => sum + MICRONUTRIENT_INFO[key].credit * share, 0);
  // Protein earns points in proportion to how well its amino acids match the body's needs (nutrition.rs).
  const aminoScore = aminoAcidProfile({ protein: food.protein, aminoAcids: food.amino_acids })?.score ?? 1;
  const proteinQuality = 1 - Math.min(1, Math.max(0, weights.proteinQuality)) * (1 - aminoScore);
  const points = weights.protein * protein * proteinQuality + weights.fiber * fiber - weights.satFat * satFat
    - weights.freeSugar * freeSugar - weights.sodium * sodiumMg / 100 + weights.micronutrients * dailyValues;
  const kcal = per100(food.calories);
  return [
    { label: 'Free sugar (g / 100 g)', expression: `max(0, sugar − ${weights.sugarAllowance} × fibre) = max(0, ${num(sugar)} − ${weights.sugarAllowance} × ${num(fiber)})`, result: num(freeSugar) },
    ...(dailyValueShares.length > 0 ? [{
      label: 'Vitamins, minerals & omega-3 (daily values in 100 g)',
      expression: dailyValueShares.map(([key, share]) => `${MICRONUTRIENT_INFO[key].label} ${pct(share * 100)}${MICRONUTRIENT_INFO[key].credit === 2 ? ' × 2' : ''}`).join(' + '),
      result: num(dailyValues),
    }] : []),
    ...(aminoScore < 1 ? [{
      label: 'Protein quality (share of protein points kept)',
      expression: `1 − ${weights.proteinQuality} × (1 − amino acid score) = 1 − ${weights.proteinQuality} × (1 − ${num(aminoScore)})`,
      result: num(proteinQuality),
    }] : []),
    {
      label: 'Points per 100 g (Nutrition sliders)',
      expression: `${weights.protein} × protein${aminoScore < 1 ? ' × protein quality' : ''} + ${weights.fiber} × fibre − ${weights.satFat} × sat. fat − ${weights.freeSugar} × free sugar − ${weights.sodium} × sodium mg ÷ 100 + ${weights.micronutrients} × vitamins, minerals & omega-3`
        + ` = ${weights.protein} × ${num(protein)}${aminoScore < 1 ? ` × ${num(proteinQuality)}` : ''} + ${weights.fiber} × ${num(fiber)} − ${weights.satFat} × ${num(satFat)} − ${weights.freeSugar} × ${num(freeSugar)} − ${weights.sodium} × ${num(sodiumMg)} ÷ 100 + ${weights.micronutrients} × ${num(dailyValues)}`,
      result: num(points),
    },
    { label: 'Per 100 kcal', expression: `points × 100 ÷ kcal per 100 g = ${num(points)} × 100 ÷ ${num(kcal)}`, result: num(row.nutrition_score) },
  ];
}
