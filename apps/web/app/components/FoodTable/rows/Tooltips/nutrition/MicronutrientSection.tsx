import { MICRONUTRIENT_KEYS, type NutritionDetail } from '../../../types/FoodTableTypes';
import { MICRONUTRIENT_INFO, nutritionScale } from '../../../nutrition/FoodTableCalculations';
import { dailyNeeds, needsLabel, type DietSettings, type NutrientStandard } from '../../../nutrition/FoodTableRda';
import { TooltipSection, TooltipRow } from '../../../../Table/Tooltip';
import { dayScaleOf, needColor } from './nutritionColors';

type Props = { detail: NutritionDetail; diet?: DietSettings | null; standard: NutrientStandard };

/** Vitamins, minerals and omega-3 as a % of daily need per 100 calories, and for the whole diet with absorption and supplements. */
export function MicronutrientSection({ detail, diet, standard }: Props) {
  const scale = nutritionScale(detail.calories);
  const dayScale = dayScaleOf(diet);
  const sex = diet?.sex ?? null, age = diet?.age ?? null, weightLb = diet?.weightLb ?? null;
  const needs = dailyNeeds(standard, sex, age, weightLb);
  const needsName = needsLabel(standard, sex, age, weightLb);
  const keys = MICRONUTRIENT_KEYS.filter(key => detail.micronutrients?.[key] != null || (diet?.supplements?.[key] ?? 0) > 0);
  if (keys.length === 0) return null;

  return (
    <TooltipSection title="Vitamins, minerals & omega-3 (% daily need)">
      <div className="text-neutral-400 -mt-1 mb-1">{dayScale != null ? `per 100 cal, (whole diet) · ${needsName}` : needsName}</div>
      {keys.map(key => {
        const { label, unit, credit } = MICRONUTRIENT_INFO[key];
        const amount = (detail.micronutrients?.[key] ?? 0) * scale;
        const supplement = diet?.supplements?.[key] ?? 0;
        const wholeDayPercent = dayScale == null ? null : (amount * dayScale * (diet?.absorption?.[key] ?? 1) + supplement) / needs[key] * 100;
        return (
          <TooltipRow key={key} label={credit === 2 ? <>{label} <span className="text-amber-300">×2</span></> : label} value={
            <>
              {amount.toLocaleString(undefined, { maximumSignificantDigits: 3 })} {unit}
              <span className="ml-2 inline-block w-12 text-right text-neutral-400">{(amount / needs[key] * 100).toFixed(0)}%</span>
              {wholeDayPercent !== null && (
                <span className={`ml-1 inline-block w-20 text-right ${needColor(wholeDayPercent)}`} title={supplement > 0 ? 'Includes your supplement' : undefined}>
                  ({wholeDayPercent.toFixed(0)}%{supplement > 0 && '+'})
                </span>
              )}
            </>
          } />
        );
      })}
    </TooltipSection>
  );
}
