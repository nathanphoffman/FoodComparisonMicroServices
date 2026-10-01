import { MICRONUTRIENT_KEYS, type NutritionDetail } from '../FoodTableTypes';
import { MICRONUTRIENT_INFO, nutritionScale } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';

export function NutritionTooltip({ detail, children }: { detail: NutritionDetail; children: React.ReactNode }) {
  const scale = nutritionScale(detail.calories);
  const micronutrients = MICRONUTRIENT_KEYS.filter(key => detail.micronutrients?.[key] != null);
  return (
    <Tooltip content={
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <TooltipSection title="Nutrition (per 100 cal)">
          <TooltipRow label="Total fat" value={`${(detail.fat * scale).toFixed(1)} g`} />
          <TooltipRow label="Sat. fat" value={`${(detail.saturatedFat * scale).toFixed(1)} g`} />
          {detail.transFat != null && <TooltipRow label="Trans fat" value={`${(detail.transFat * scale).toFixed(1)} g`} />}
          {detail.cholesterol != null && <TooltipRow label="Cholesterol" value={`${(detail.cholesterol * scale).toFixed(0)} mg`} />}
          {detail.sodium != null && <TooltipRow label="Sodium" value={`${(detail.sodium * scale).toFixed(0)} mg`} />}
          {detail.carbs != null && <TooltipRow label="Total carbs" value={`${(detail.carbs * scale).toFixed(1)} g`} />}
          <TooltipRow label="Fiber" value={`${(detail.fiber * scale).toFixed(1)} g`} />
          {detail.sugar != null && <TooltipRow label="Sugar" value={`${(detail.sugar * scale).toFixed(1)} g`} />}
          <TooltipRow label="Protein" value={`${(detail.protein * scale).toFixed(1)} g`} />
        </TooltipSection>
        {micronutrients.length > 0 && (
          <TooltipSection title="Vitamins, minerals & omega-3 (% daily value)">
            {micronutrients.map(key => {
              const { label, unit, dailyValue, credit } = MICRONUTRIENT_INFO[key];
              const amount = detail.micronutrients![key]! * scale;
              return (
                <TooltipRow key={key} label={credit === 2 ? <>{label} <span className="text-amber-300">×2</span></> : label} value={
                  <>
                    {amount.toLocaleString(undefined, { maximumSignificantDigits: 3 })} {unit}
                    <span className="ml-2 inline-block w-10 text-right text-neutral-400">{(amount / dailyValue * 100).toFixed(0)}%</span>
                  </>
                } />
              );
            })}
          </TooltipSection>
        )}
      </div>
    }>
      {children}
    </Tooltip>
  );
}
