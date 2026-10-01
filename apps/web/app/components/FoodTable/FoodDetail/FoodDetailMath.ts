import { MICRONUTRIENT_KEYS, type RawFood, type SliderValues } from '../FoodTableTypes';
import type { ScoredRow } from '../FoodTableSort';
import type { FigureKey } from './FoodDetailFigures';
import { MICRONUTRIENT_INFO, formatIntelligenceValue } from '../FoodTableCalculations';

/** One line of a figure's working: label, the equation with this food's numbers, the result. */
export type MathStep = { label: string; expression: string; result: string };

export type MathContext = {
  sliders:       SliderValues;
  unit:          string;            // Compare By unit label, e.g. 'weighted unit'
  referenceRow:  ScoredRow | undefined;
  referenceName: string;
  figureLabels:  Record<FigureKey, string>;
};

// Display copies of constants in services/wasm-calculations — keep in sync.
const GWP_CH4 = 28;                        // emissions.rs
const GWP_N2O = 265;
const SQUARE_METERS_PER_HA = 10_000;       // eco/constants.rs
const FIBER_SCORE_WEIGHT = 2;              // nutrition.rs
const SAT_FAT_SCORE_PENALTY = 2;
const SUGAR_FIBER_ALLOWANCE = 5;
const FREE_SUGAR_SCORE_PENALTY = 0.25;
const SODIUM_MG_PER_SCORE_POINT = 50;
const MICRONUTRIENT_SCORE_WEIGHT = 1;

/** Plain numbers to 4 significant figures; huge harm scores as 1.2T etc. */
function num(value: number): string {
  if (Math.abs(value) >= 1e6) return formatIntelligenceValue(value);
  return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}

const pct = (share: number) => `${num(share)}%`;

/** Final 'per Compare By unit' step: per-kg value ÷ units in one kg. */
function perUnitStep(perKg: number, divisor: number, unit: string, result: number): MathStep {
  return {
    label: `Per ${unit}`,
    expression: `${num(perKg)} ÷ ${num(divisor)} (${unit}s in 1 kg)`,
    result: num(result),
  };
}

/** Step-by-step working for one figure; [] when there is nothing to show. */
export function figureMath(key: FigureKey, food: RawFood, row: ScoredRow | undefined, context: MathContext): MathStep[] {
  if (!row) return [];
  const { sliders, unit } = context;
  const divisor = row.divisor;

  switch (key) {
    case 'nutritionScore': {
      if (row.nutrition_score == null || food.calories <= 0) return [];
      // Per 100 g so the numbers read like a label; same score as nutrition.rs's per-gram maths.
      const per100 = (perGram: number | null) => (perGram ?? 0) * 100;
      const protein = per100(food.protein);
      const fiber = per100(food.fiber);
      const satFat = per100(food.sat_fat);
      const sugar = per100(food.sugar);
      const sodiumMg = per100(food.sodium);
      const freeSugar = Math.max(0, sugar - SUGAR_FIBER_ALLOWANCE * fiber);
      // Share of each vitamin/mineral's daily value in 100 g; missing ones add nothing.
      const dailyValueShares = MICRONUTRIENT_KEYS
        .filter(key => food.micronutrients?.[key] != null)
        .map(key => [key, per100(food.micronutrients![key]!) / MICRONUTRIENT_INFO[key].dailyValue] as const);
      const dailyValues = dailyValueShares.reduce((sum, [key, share]) => sum + MICRONUTRIENT_INFO[key].credit * share, 0);
      const points = protein + FIBER_SCORE_WEIGHT * fiber - SAT_FAT_SCORE_PENALTY * satFat
        - FREE_SUGAR_SCORE_PENALTY * freeSugar - sodiumMg / SODIUM_MG_PER_SCORE_POINT + MICRONUTRIENT_SCORE_WEIGHT * dailyValues;
      const kcal = per100(food.calories);
      return [
        { label: 'Free sugar (g / 100 g)', expression: `max(0, sugar − ${SUGAR_FIBER_ALLOWANCE} × fibre) = max(0, ${num(sugar)} − ${SUGAR_FIBER_ALLOWANCE} × ${num(fiber)})`, result: num(freeSugar) },
        ...(dailyValueShares.length > 0 ? [{
          label: 'Vitamins, minerals & omega-3 (daily values in 100 g)',
          expression: dailyValueShares.map(([key, share]) => `${MICRONUTRIENT_INFO[key].label} ${pct(share * 100)}${MICRONUTRIENT_INFO[key].credit === 2 ? ' × 2' : ''}`).join(' + '),
          result: num(dailyValues),
        }] : []),
        {
          label: 'Points per 100 g',
          expression: `protein + ${FIBER_SCORE_WEIGHT} × fibre − ${SAT_FAT_SCORE_PENALTY} × sat. fat − ${FREE_SUGAR_SCORE_PENALTY} × free sugar − sodium mg ÷ ${SODIUM_MG_PER_SCORE_POINT} + ${MICRONUTRIENT_SCORE_WEIGHT} × vitamins, minerals & omega-3`
            + ` = ${num(protein)} + ${FIBER_SCORE_WEIGHT} × ${num(fiber)} − ${SAT_FAT_SCORE_PENALTY} × ${num(satFat)} − ${FREE_SUGAR_SCORE_PENALTY} × ${num(freeSugar)} − ${num(sodiumMg)} ÷ ${SODIUM_MG_PER_SCORE_POINT} + ${MICRONUTRIENT_SCORE_WEIGHT} × ${num(dailyValues)}`,
          result: num(points),
        },
        { label: 'Per 100 kcal', expression: `points × 100 ÷ kcal per 100 g = ${num(points)} × 100 ÷ ${num(kcal)}`, result: num(row.nutrition_score) },
      ];
    }

    case 'emissions': {
      if (row.emissions == null) return [];
      const perKg = row.emissions * divisor;
      const breakdown = row.emissions_breakdown;
      const steps: MathStep[] = breakdown
        ? [{
            label: 'kg CO₂e per kg',
            expression: `CO₂ + CH₄ × ${GWP_CH4} + N₂O × ${GWP_N2O} + feed crops = ${num(breakdown.co2)} + ${num(breakdown.ch4 / GWP_CH4)} × ${GWP_CH4} + ${num(breakdown.n2o / GWP_N2O)} × ${GWP_N2O} + ${num(breakdown.feedEmissions ?? 0)}`,
            result: num(perKg),
          }]
        : [{ label: 'kg CO₂e per kg', expression: food.tags.includes('composite') ? 'ingredients\' farm emissions + processing' : 'published emissions per kg', result: num(perKg) }];
      return [...steps, perUnitStep(perKg, divisor, unit, row.emissions)];
    }

    case 'landUse': {
      if (row.land_use == null) return [];
      const detail = row.land_use_detail;
      const steps: MathStep[] = [];
      if (detail.type === 'plant') {
        if (!detail.yieldKilogramsPerHectare) return [{ label: 'm² per kg', expression: 'no farmland (wild-harvested or none recorded)', result: '0' }];
        steps.push({ label: 'm² per kg', expression: `${num(SQUARE_METERS_PER_HA)} m² ÷ yield ${num(detail.yieldKilogramsPerHectare)} kg/ha`, result: num(detail.rawM2PerKg) });
      } else {
        const pastureM2 = (detail.pastureHectaresPerKilogram ?? 0) * SQUARE_METERS_PER_HA;
        steps.push({
          label: 'm² per kg',
          expression: `grazing ${num(detail.pastureHectaresPerKilogram ?? 0)} ha × ${num(SQUARE_METERS_PER_HA)} + feed cropland ${num(detail.feedLandM2PerKg ?? 0)} m² = ${num(pastureM2)} + ${num(detail.feedLandM2PerKg ?? 0)}`,
          result: num(detail.rawM2PerKg),
        });
      }
      const weighted = detail.rawM2PerKg * detail.multiplier;
      steps.push({ label: 'Weighted by land type', expression: `${num(detail.rawM2PerKg)} × ${num(detail.multiplier)} (Land Use sliders over this food's land split)`, result: num(weighted) });
      steps.push(perUnitStep(weighted, divisor, unit, row.land_use));
      return steps;
    }

    case 'water': {
      if (row.water == null) return [];
      const perKg = row.water * divisor;
      const { green, blue, grey } = row.water_detail;
      const source = food.type === 'animal' ? 'its feed crops' : 'the crop';
      const steps: MathStep[] = green != null && blue != null
        ? [{
            label: 'L per kg',
            expression: `blue + green × ${pct(sliders.greenWaterWeight)} + grey × ${pct(sliders.greyWaterWeight)} = ${num(blue)} + ${num(green)} × ${pct(sliders.greenWaterWeight)} + ${num(grey ?? 0)} × ${pct(sliders.greyWaterWeight)}`,
            result: num(perKg),
          }]
        : [{ label: 'L per kg', expression: `total water for ${source} (no green/blue/grey split)`, result: num(perKg) }];
      return [...steps, perUnitStep(perKg, divisor, unit, row.water)];
    }

    case 'directKill': {
      if (row.direct_kill == null) return [];
      const kill = row.kill_detail;
      const perKg = row.direct_kill * divisor;
      const steps: MathStep[] = [];
      if (kill) {
        steps.push({
          label: 'Intelligence per death',
          expression: `(neurons^${sliders.neuronExponent} × lifespan ÷ weight^${sliders.weightExponent})^${sliders.finalIntelligenceExponent} = (${num(food.neuron_count)}^${sliders.neuronExponent} × ${num(kill.lifespanYears)} yr ÷ ${num(food.weight_kg ?? 0)} kg^${sliders.weightExponent})^${sliders.finalIntelligenceExponent}`,
          result: num(kill.intelligencePerDeath),
        });
        const deaths = 1 + kill.offspringDeaths;
        const own = kill.intelligencePerDeath * deaths / kill.outputKgPerDeath;
        steps.push({
          label: 'Per kg',
          expression: `intelligence × (1 + ${num(kill.offspringDeaths)} offspring) ÷ ${num(kill.outputKgPerDeath)} kg of food per animal`,
          result: num(own),
        });
      }
      if (row.wild_fish_kill > 0) {
        const fishPerKg = row.wild_fish_deaths_per_kg;
        steps.push({
          label: 'Wild fish for feed (per kg)',
          expression: fishPerKg != null
            ? `${num(fishPerKg)} fish per kg × ${num(row.wild_fish_kill / fishPerKg)} intelligence per fish`
            : 'wild fish killed for fishmeal / fish oil in its feed',
          result: num(row.wild_fish_kill),
        });
      }
      if (steps.length === 0) return [{ label: 'Per kg', expression: 'no animals are killed on purpose for this food', result: '0' }];
      if (kill && row.wild_fish_kill > 0) {
        steps.push({ label: 'Total per kg', expression: `animal + wild fish = ${num(perKg - row.wild_fish_kill)} + ${num(row.wild_fish_kill)}`, result: num(perKg) });
      }
      steps.push(perUnitStep(perKg, divisor, unit, row.direct_kill));
      return steps;
    }

    case 'captiveSentience': {
      const kill = row.kill_detail;
      if (row.captive_sentience == null || !kill) {
        return [{ label: 'Per kg', expression: 'no animals are kept in captivity for this food', result: '0' }];
      }
      const years = kill.captivityYears + kill.offspringDeaths * kill.offspringCaptivityYears;
      const perKg = row.captive_sentience * divisor;
      return [
        { label: 'Years in captivity per animal', expression: `own ${num(kill.captivityYears)} + ${num(kill.offspringDeaths)} offspring × ${num(kill.offspringCaptivityYears)}`, result: num(years) },
        {
          label: 'Per kg',
          expression: `intelligence ${num(kill.intelligencePerDeath)} × ${num(years)} years × ${num(sliders.captivityMultiplier)} (Captivity slider) ÷ ${num(kill.outputKgPerDeath)} kg of food per animal`,
          result: num(perKg),
        },
        perUnitStep(perKg, divisor, unit, row.captive_sentience),
      ];
    }

    case 'sentientHarm': {
      if (row.sentient_harm == null) return [];
      const detail = row.sentient_harm_detail;
      const parts: [string, number][] = [
        ['insects', detail.insectScore],
        ['bees', detail.beeScore],
        ['soil life', detail.wormScore],
        ['land clearing', detail.deforestationScore],
        ['feed insects', detail.feedInsectScore],
        ['feed bees', detail.feedBeeScore],
        ['feed soil life', detail.feedWormScore],
        ['feed land clearing', detail.feedDeforestationScore],
        ['pasture clearing', detail.pastureDeforestationScore],
        ['bycatch', detail.bycatchScore],
      ];
      const shown = parts.filter(([, score]) => score > 0);
      const accidental = shown.reduce((sum, [, score]) => sum + score, 0);
      const intentional = detail.directKillScore + detail.captiveSentienceScore;
      const killMultiplier = sliders.killMultiplier;
      const perKg = row.sentient_harm * divisor;
      const steps: MathStep[] = [];
      if (shown.length > 0) {
        steps.push({ label: 'Accidental deaths (per kg)', expression: shown.map(([name, score]) => `${name} ${num(score)}`).join(' + '), result: num(accidental) });
      }
      if (killMultiplier > 0) {
        if (intentional > 0) {
          steps.push({ label: 'Intentional (per kg)', expression: `direct kill ${num(detail.directKillScore)} + captivity ${num(detail.captiveSentienceScore)}`, result: num(intentional) });
        }
        steps.push({
          label: 'Total per kg',
          expression: `intentional + accidental ÷ ${num(killMultiplier)} (Kill : Accident slider) = ${num(intentional)} + ${num(accidental)} ÷ ${num(killMultiplier)}`,
          result: num(perKg),
        });
      } else {
        steps.push({ label: 'Total per kg', expression: 'accidental only (intentional harm is dropped at 0×)', result: num(perKg) });
      }
      steps.push(perUnitStep(perKg, divisor, unit, row.sentient_harm));
      return steps;
    }

    case 'availability': {
      if (row.availability == null) return [];
      const production = food.availability_gg;
      if (production == null) return [{ label: 'Availability', expression: 'no production figure, so it is set to 1 (the worst score)', result: '1' }];
      const units = production * divisor;
      const landM2 = row.land_use_detail.rawM2PerKg;
      if (landM2 === 0) {
        return [{ label: 'Production', expression: `${num(production)} Gg × ${num(divisor)} ${unit}s per kg (no farmland, so not divided by land)`, result: num(row.availability) }];
      }
      const landPerUnit = landM2 / divisor;
      return [
        { label: `Production (Gg of ${unit}s)`, expression: `${num(production)} Gg × ${num(divisor)} ${unit}s per kg`, result: num(units) },
        { label: `Land per ${unit} (m²)`, expression: `${num(landM2)} m² per kg ÷ ${num(divisor)}`, result: num(landPerUnit) },
        { label: 'Availability', expression: `production ÷ land per ${unit} = ${num(units)} ÷ ${num(landPerUnit)}`, result: num(row.availability) },
      ];
    }

    case 'finalScore': {
      const detail = row.improvement_detail;
      if (row.final_score == null) return [];
      if (!detail) return [{ label: 'Improvement', expression: `this food has none of the Compare By unit, so it scores 0`, result: '0x' }];
      const ref = context.referenceRow;
      const measureLabel: Record<string, string> = {
        nutrition: 'Nutrition', emissions: 'CO₂e', landUse: 'Land use', water: 'Water', sentientHarm: 'Sentient harm', availability: 'Availability',
      };
      const values: Record<string, [number | null, number | null]> = {
        nutrition:    [row.nutrition_score, ref?.nutrition_score ?? null],
        emissions:    [row.emissions, ref?.emissions ?? null],
        landUse:      [row.land_use, ref?.land_use ?? null],
        water:        [row.water, ref?.water ?? null],
        sentientHarm: [row.sentient_harm, ref?.sentient_harm ?? null],
        availability: [row.availability, ref?.availability ?? null],
      };
      const higherIsBetter = (measure: string) => measure === 'nutrition' || measure === 'availability';
      const steps: MathStep[] = detail.terms.map(term => {
        const [foodValue, referenceValue] = values[term.measure];
        let expression: string;
        if (term.zeroCapped) {
          expression = `scored 0 (perfect), so it gets the batch's best ratio × ${num(sliders.zeroBetterMultiplier)}`;
        } else if (term.measure === 'nutrition') {
          expression = `food vs ${context.referenceName} (${num(foodValue ?? 0)} vs ${num(referenceValue ?? 0)}), both shifted so every score is positive`;
        } else if (higherIsBetter(term.measure)) {
          expression = `food ÷ ${context.referenceName} = ${num(foodValue ?? 0)} ÷ ${num(referenceValue ?? 0)}`;
        } else {
          expression = `${context.referenceName} ÷ food = ${num(referenceValue ?? 0)} ÷ ${num(foodValue ?? 0)}`;
        }
        return { label: `${measureLabel[term.measure]} ratio (weight ${pct(term.priority)})`, expression, result: `${num(term.ratio)}x` };
      });
      const meanName = Math.abs(detail.exponent) < 1e-9 ? 'weighted geometric mean'
        : detail.exponent === 1 ? 'weighted average'
        : `weighted power mean (exponent ${num(detail.exponent)}, from the Win Dampening slider)`;
      steps.push({ label: 'Combined', expression: `${meanName} of the ratios above, using the priority weights`, result: `${num(detail.mean)}x` });
      if (Math.abs(detail.wildPenalty - 1) > 1e-9) {
        steps.push({ label: 'Wild penalty', expression: `${num(detail.mean)} ÷ ${num(detail.wildPenalty)} (Over-Hunting / Over-Gathering slider)`, result: `${num(row.final_score)}x` });
      }
      return steps;
    }
  }
}
