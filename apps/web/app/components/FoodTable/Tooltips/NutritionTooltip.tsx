import { MICRONUTRIENT_KEYS, type NutritionDetail } from '../FoodTableTypes';
import { MICRONUTRIENT_INFO, aminoAcidProfile, nutritionScale } from '../FoodTableCalculations';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';

// dailyCalories is the user's whole-day calories (diet row only). It scales the per-100-calorie
// amounts up to the whole day, so 10% per 100 cal on a 2000 cal diet reads (200%).
export function NutritionTooltip({ detail, dailyCalories, children }: { detail: NutritionDetail; dailyCalories?: number | null; children: React.ReactNode }) {
  const scale = nutritionScale(detail.calories);
  const dayScale = dailyCalories ? dailyCalories / 100 : null;
  const micronutrients = MICRONUTRIENT_KEYS.filter(key => detail.micronutrients?.[key] != null);
  const aminoAcids = aminoAcidProfile(detail);
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
          <TooltipSection title={dayScale != null ? "Vitamins, minerals & omega-3 (% daily value per 100 cal, (whole diet))" : "Vitamins, minerals & omega-3 (% daily value)"}>
            {micronutrients.map(key => {
              const { label, unit, dailyValue, credit } = MICRONUTRIENT_INFO[key];
              const amount = detail.micronutrients![key]! * scale;
              return (
                <TooltipRow key={key} label={credit === 2 ? <>{label} <span className="text-amber-300">×2</span></> : label} value={
                  <>
                    {amount.toLocaleString(undefined, { maximumSignificantDigits: 3 })} {unit}
                    <span className="ml-2 inline-block w-10 text-right text-neutral-400">{(amount / dailyValue * 100).toFixed(0)}%</span>
                    {dayScale != null && <span className="ml-1 inline-block w-14 text-right text-green-300">({(amount * dayScale / dailyValue * 100).toFixed(0)}%)</span>}
                  </>
                } />
              );
            })}
          </TooltipSection>
        )}
        {aminoAcids && (
          <TooltipSection title="Amino acids (mg per g of protein, % of need)">
            {aminoAcids.score != null && (
              <TooltipRow label={<span className="font-medium">Amino acid score</span>} value={
                <>
                  <span className="font-medium">{(aminoAcids.score * 100).toFixed(0)}%</span>
                  {aminoAcids.limiting && aminoAcids.score < 1 && <span className="ml-2 text-amber-300">limited by {aminoAcids.limiting.toLowerCase()}</span>}
                </>
              } />
            )}
            {aminoAcids.requirements.map(({ label, mgPerGramProtein, share }) => (
              <TooltipRow key={label} label={label} value={
                <>
                  {mgPerGramProtein.toLocaleString(undefined, { maximumFractionDigits: 1 })} mg
                  <span className={`ml-2 inline-block w-10 text-right ${share < 1 ? 'text-amber-300' : 'text-neutral-400'}`}>{(share * 100).toFixed(0)}%</span>
                </>
              } />
            ))}
            {aminoAcids.others.length > 0 && <div className="mt-1 text-xs text-neutral-400">Other amino acids</div>}
            {aminoAcids.others.map(({ label, mgPerGramProtein }) => (
              <TooltipRow key={label} label={label} value={`${mgPerGramProtein.toLocaleString(undefined, { maximumFractionDigits: 1 })} mg`} />
            ))}
          </TooltipSection>
        )}
      </div>
    }>
      {children}
    </Tooltip>
  );
}
