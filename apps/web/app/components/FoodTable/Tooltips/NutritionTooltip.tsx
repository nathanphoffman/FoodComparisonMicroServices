import { MICRONUTRIENT_KEYS, type NutritionDetail } from '../FoodTableTypes';
import { MICRONUTRIENT_INFO, aminoAcidProfile, nutritionScale } from '../FoodTableCalculations';
import { dailyNeeds, needsLabel, DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from '../FoodTableRda';
import { dailyTargets, targetColor } from '../FoodTableTargets';
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
type Props = { detail: NutritionDetail; diet?: DietSettings | null; standard?: NutrientStandard };

// The nutrition breakdown shown in a food's tooltip and in the Diet modal.
export function NutritionDetailContent({ detail, diet, standard = DEFAULT_NUTRIENT_STANDARD }: Props) {
  const scale = nutritionScale(detail.calories);
  const dayScale = diet?.calories ? diet.calories / 100 : null;
  const needsName = needsLabel(standard, diet?.sex ?? null, diet?.age ?? null, diet?.weightLb ?? null);
  const targets = dayScale != null ? dailyTargets(standard, diet?.sex ?? null, diet!.calories!, diet?.weightLb ?? null, diet?.activity ?? 0) : {};
  // Free sugar the way the score counts it: sugar beyond 5 g per g of fiber.
  const freeSugar = detail.sugar != null ? Math.max(detail.sugar - 5 * detail.fiber, 0) : null;
  const rows = [
    { label: 'Total fat', perHundred: detail.fat * scale, unit: 'g', digits: 1, target: targets.fat },
    { label: 'Sat. fat', perHundred: detail.saturatedFat * scale, unit: 'g', digits: 1, target: targets.satFat },
    ...(detail.transFat != null ? [{ label: 'Trans fat', perHundred: detail.transFat * scale, unit: 'g', digits: 1, target: targets.transFat }] : []),
    ...(detail.cholesterol != null ? [{ label: 'Cholesterol', perHundred: detail.cholesterol * scale, unit: 'mg', digits: 0, target: targets.cholesterol }] : []),
    ...(detail.sodium != null ? [{ label: 'Sodium', perHundred: detail.sodium * scale, unit: 'mg', digits: 0, target: targets.sodium }] : []),
    ...(detail.carbs != null ? [{ label: 'Total carbs', perHundred: detail.carbs * scale, unit: 'g', digits: 1, target: targets.carbs }] : []),
    { label: 'Fiber', perHundred: detail.fiber * scale, unit: 'g', digits: 1, target: targets.fiber },
    // The sugar % is for free sugar against the added-sugar limit; the amount shown is total sugar.
    ...(detail.sugar != null ? [{ label: 'Sugar', perHundred: detail.sugar * scale, unit: 'g', digits: 1, target: targets.sugar && freeSugar !== null ? { ...targets.sugar, amount: targets.sugar.amount * (detail.sugar / Math.max(freeSugar, 1e-9)) } : undefined }] : []),
    { label: 'Protein', perHundred: detail.protein * scale, unit: 'g', digits: 1, target: targets.protein },
  ];
  const needs = dailyNeeds(standard, diet?.sex ?? null, diet?.age ?? null, diet?.weightLb ?? null);
  const micronutrients = MICRONUTRIENT_KEYS.filter(key => detail.micronutrients?.[key] != null);
  const aminoAcids = aminoAcidProfile(detail);
  return (
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <TooltipSection title="Nutrition (per 100 cal)">
          {rows.map(row => (
            <TooltipRow key={row.label} label={row.label} value={
              <>
                {row.perHundred.toFixed(row.digits)} {row.unit}
                {dayScale != null && (
                  <span className={`ml-1 ${row.target ? targetColor(row.perHundred * dayScale / row.target.amount * 100, row.target.kind) || needColor(row.perHundred * dayScale / row.target.amount * 100) : 'text-green-300'}`}>
                    ({(row.perHundred * dayScale).toFixed(row.digits > 0 && row.perHundred * dayScale < 10 ? 1 : 0)} {row.unit}{row.target && `, ${(row.perHundred * dayScale / row.target.amount * 100).toFixed(0)}% of ${row.target.kind === 'max' ? 'limit' : row.target.kind === 'range' ? 'target' : 'need'}`})
                  </span>
                )}
              </>
            } />
          ))}
        </TooltipSection>
        {micronutrients.length > 0 && (
          <TooltipSection title="Vitamins, minerals & omega-3 (% daily need)">
            <div className="text-neutral-400 -mt-1 mb-1">{dayScale != null ? `per 100 cal, (whole diet) · ${needsName}` : needsName}</div>
            {micronutrients.map(key => {
              const { label, unit, credit } = MICRONUTRIENT_INFO[key];
              const amount = detail.micronutrients![key]! * scale;
              return (
                <TooltipRow key={key} label={credit === 2 ? <>{label} <span className="text-amber-300">×2</span></> : label} value={
                  <>
                    {amount.toLocaleString(undefined, { maximumSignificantDigits: 3 })} {unit}
                    <span className="ml-2 inline-block w-12 text-right text-neutral-400">{(amount / needs[key] * 100).toFixed(0)}%</span>
                    {dayScale != null && (() => {
                      const dayPercent = amount * dayScale * (diet?.absorption?.[key] ?? 1) / needs[key] * 100;
                      return <span className={`ml-1 inline-block w-20 text-right ${needColor(dayPercent)}`}>({dayPercent.toFixed(0)}%)</span>;
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
                  <span className={`ml-2 inline-block w-12 text-right ${needColor(share * 100)}`}>{(share * 100).toFixed(0)}%</span>
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
  );
}

export function NutritionTooltip({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <Tooltip content={<NutritionDetailContent {...props} />}>
      {children}
    </Tooltip>
  );
}
