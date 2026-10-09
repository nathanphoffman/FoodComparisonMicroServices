import { MICRONUTRIENT_KEYS, type NutritionDetail } from '../FoodTableTypes';
import { MICRONUTRIENT_INFO, aminoAcidProfile, nutritionScale } from '../FoodTableCalculations';
import { dailyNeeds, needsLabel, proteinNeedGrams, DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from '../FoodTableRda';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';

// Colour for a whole-diet % of daily need: red under 50, orange 50–75, yellow 75–125 (about right),
// green 125–250, blue over 250 (not necessarily bad, just a lot).
function needColor(percent: number): string {
  if (percent < 50) return 'text-red-400';
  if (percent < 75) return 'text-orange-300';
  if (percent < 125) return 'text-yellow-300';
  if (percent <= 250) return 'text-green-300';
  return 'text-blue-300';
}

// diet (diet row only) holds the user's whole-day calories, sex and age. Calories scale the per-100-calorie
// amounts up to the whole day, so 10% per 100 cal on a 2000 cal diet reads (200%); sex and age pick
// their own daily need for each nutrient instead of the FDA daily value.
export function NutritionTooltip({ detail, diet, standard = DEFAULT_NUTRIENT_STANDARD, children }: { detail: NutritionDetail; diet?: DietSettings | null; standard?: NutrientStandard; children: React.ReactNode }) {
  const scale = nutritionScale(detail.calories);
  const dayScale = diet?.calories ? diet.calories / 100 : null;
  const needsName = needsLabel(standard, diet?.sex ?? null, diet?.age ?? null, diet?.weightLb ?? null);
  const proteinNeed = proteinNeedGrams(diet?.weightLb ?? null);
  const needs = dailyNeeds(standard, diet?.sex ?? null, diet?.age ?? null, diet?.weightLb ?? null);
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
          <TooltipRow label="Protein" value={
            <>
              {(detail.protein * scale).toFixed(1)} g
              {dayScale != null && (
                <span className={`ml-1 ${proteinNeed != null ? needColor(detail.protein * scale * dayScale / proteinNeed * 100) : 'text-green-300'}`}>
                  ({(detail.protein * scale * dayScale).toFixed(0)} g{proteinNeed != null && `, ${(detail.protein * scale * dayScale / proteinNeed * 100).toFixed(0)}% of need`})
                </span>
              )}
            </>
          } />
        </TooltipSection>
        {micronutrients.length > 0 && (
          <TooltipSection title={dayScale != null ? `Vitamins, minerals & omega-3 (% of daily need per 100 cal, (whole diet) — ${needsName})` : `Vitamins, minerals & omega-3 (% of daily need — ${needsName})`}>
            {micronutrients.map(key => {
              const { label, unit, credit } = MICRONUTRIENT_INFO[key];
              const amount = detail.micronutrients![key]! * scale;
              return (
                <TooltipRow key={key} label={credit === 2 ? <>{label} <span className="text-amber-300">×2</span></> : label} value={
                  <>
                    {amount.toLocaleString(undefined, { maximumSignificantDigits: 3 })} {unit}
                    <span className="ml-2 inline-block w-10 text-right text-neutral-400">{(amount / needs[key] * 100).toFixed(0)}%</span>
                    {dayScale != null && (() => {
                      const dayPercent = amount * dayScale * (diet?.absorption?.[key] ?? 1) / needs[key] * 100;
                      return <span className={`ml-1 inline-block w-14 text-right ${needColor(dayPercent)}`}>({dayPercent.toFixed(0)}%)</span>;
                    })()}
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
                  <span className={`font-medium ${needColor(aminoAcids.score * 100)}`}>{(aminoAcids.score * 100).toFixed(0)}%</span>
                  {aminoAcids.limiting && aminoAcids.score < 1 && <span className="ml-2 text-amber-300">limited by {aminoAcids.limiting.toLowerCase()}</span>}
                </>
              } />
            )}
            {aminoAcids.requirements.map(({ label, mgPerGramProtein, share }) => (
              <TooltipRow key={label} label={label} value={
                <>
                  {mgPerGramProtein.toLocaleString(undefined, { maximumFractionDigits: 1 })} mg
                  <span className={`ml-2 inline-block w-10 text-right ${needColor(share * 100)}`}>{(share * 100).toFixed(0)}%</span>
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
