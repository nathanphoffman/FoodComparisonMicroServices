import type { NutritionDetail } from '../../../types/FoodTableTypes';
import { nutritionScale } from '../../../nutrition/FoodTableCalculations';
import type { DietSettings, NutrientStandard } from '../../../nutrition/FoodTableRda';
import { dailyTargets, targetColor, type Target } from '../../../nutrition/FoodTableTargets';
import { TooltipSection, TooltipRow } from '../../../../Table/Tooltip';
import { DEFAULT_NUTRITION_WEIGHTS } from '../../../scoring/FoodTableDefaults';
import { dayScaleOf, needColor } from './nutritionColors';

// Sugar beyond this many grams per gram of fiber is "free" sugar, the way the Nutrition Score counts it (at its default setting).
const FREE_SUGAR_FIBER_ALLOWANCE = DEFAULT_NUTRITION_WEIGHTS.sugarAllowance;

// Keeps the sugar-to-free-sugar ratio finite when a food has no free sugar at all.
const SMALLEST_FREE_SUGAR = 1e-9;

// Amounts under this many grams get a decimal in the whole-day figure.
const SMALL_AMOUNT_GRAMS = 10;

type Row = { label: string; perHundred: number; unit: string; digits: number; target?: Target };
type Props = { detail: NutritionDetail; diet?: DietSettings | null; standard: NutrientStandard };

const GOAL_WORD = { max: 'limit', range: 'target', min: 'need' } as const;

/** Fat, carbs, fiber, sugar and protein per 100 calories, and for the whole day when the diet has a calorie total. */
export function MacroSection({ detail, diet, standard }: Props) {
  const scale = nutritionScale(detail.calories);
  const dayScale = dayScaleOf(diet);
  const targets = dayScale != null ? dailyTargets(standard, diet?.sex ?? null, diet!.calories!, diet?.weightLb ?? null, diet?.activity ?? 0) : {};
  const freeSugar = detail.sugar != null ? Math.max(detail.sugar - FREE_SUGAR_FIBER_ALLOWANCE * detail.fiber, 0) : null;

  // The sugar % is for free sugar against the added-sugar limit; the amount shown is total sugar.
  const sugarTarget = targets.sugar && detail.sugar != null && freeSugar !== null
    ? { ...targets.sugar, amount: targets.sugar.amount * (detail.sugar / Math.max(freeSugar, SMALLEST_FREE_SUGAR)) }
    : undefined;
  const rows: Row[] = [
    { label: 'Total fat', perHundred: detail.fat * scale, unit: 'g', digits: 1, target: targets.fat },
    { label: 'Sat. fat', perHundred: detail.saturatedFat * scale, unit: 'g', digits: 1, target: targets.satFat },
    ...(detail.transFat != null ? [{ label: 'Trans fat', perHundred: detail.transFat * scale, unit: 'g', digits: 1, target: targets.transFat }] : []),
    ...(detail.cholesterol != null ? [{ label: 'Cholesterol', perHundred: detail.cholesterol * scale, unit: 'mg', digits: 0, target: targets.cholesterol }] : []),
    ...(detail.sodium != null ? [{ label: 'Sodium', perHundred: detail.sodium * scale, unit: 'mg', digits: 0, target: targets.sodium }] : []),
    ...(detail.carbs != null ? [{ label: 'Total carbs', perHundred: detail.carbs * scale, unit: 'g', digits: 1, target: targets.carbs }] : []),
    { label: 'Fiber', perHundred: detail.fiber * scale, unit: 'g', digits: 1, target: targets.fiber },
    ...(detail.sugar != null ? [{ label: 'Sugar', perHundred: detail.sugar * scale, unit: 'g', digits: 1, target: sugarTarget }] : []),
    { label: 'Protein', perHundred: detail.protein * scale, unit: 'g', digits: 1, target: targets.protein },
  ];

  return (
    <TooltipSection title="Nutrition (per 100 cal)">
      {rows.map(row => <TooltipRow key={row.label} label={row.label} value={<MacroAmount row={row} dayScale={dayScale} />} />)}
    </TooltipSection>
  );
}

function MacroAmount({ row, dayScale }: { row: Row; dayScale: number | null }) {
  const perHundred = `${row.perHundred.toFixed(row.digits)} ${row.unit}`;

  if (dayScale == null) return <>{perHundred}</>;
  const wholeDay = row.perHundred * dayScale;
  const percent = row.target ? wholeDay / row.target.amount * 100 : null;
  const color = row.target && percent !== null ? targetColor(percent, row.target.kind) || needColor(percent) : 'text-green-300';
  const decimals = row.digits > 0 && wholeDay < SMALL_AMOUNT_GRAMS ? 1 : 0;

  return (
    <>
      {perHundred}
      <span className={`ml-1 ${color}`}>
        ({wholeDay.toFixed(decimals)} {row.unit}{row.target && percent !== null && `, ${percent.toFixed(0)}% of ${GOAL_WORD[row.target.kind]}`})
      </span>
    </>
  );
}
