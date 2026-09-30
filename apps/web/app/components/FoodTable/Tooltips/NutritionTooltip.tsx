import type { NutritionDetail } from '../FoodTableTypes';
import { nutritionScale } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';

export function NutritionTooltip({ detail, children }: { detail: NutritionDetail; children: React.ReactNode }) {
  const scale = nutritionScale(detail.calories);
  return (
    <Tooltip content={
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
    }>
      {children}
    </Tooltip>
  );
}
