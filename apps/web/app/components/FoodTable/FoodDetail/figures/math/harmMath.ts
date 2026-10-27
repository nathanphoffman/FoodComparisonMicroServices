import type { RawFood } from '../../../types/FoodTableTypes';
import type { ScoredRow } from '../../../types/FoodTableTypes';
import { formatNumber, perUnitStep, type MathStep, type MathContext } from './MathShared';
import { sumOf } from '@/lib/sumOf';

/** Working for the intentional kill: animal deaths plus wild fish used for feed. */
export function directKillMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
  if (row.directKill == null) return [];
  const kill = row.killDetail;
  const perKg = row.directKill * divisor;
  const steps: MathStep[] = [];
  if (kill) {
    steps.push({
      label: 'Intelligence per death',
      expression: `(neurons^${sliders.neuronExponent} × lifespan ÷ weight^${sliders.weightExponent})^${sliders.finalIntelligenceExponent} = (${formatNumber(food.neuron_count)}^${sliders.neuronExponent} × ${formatNumber(kill.lifespanYears)} yr ÷ ${formatNumber(food.weight_kg ?? 0)} kg^${sliders.weightExponent})^${sliders.finalIntelligenceExponent}`,
      result: formatNumber(kill.intelligencePerDeath),
    });
    const deaths = 1 + kill.offspringDeaths;
    const own = kill.intelligencePerDeath * deaths / kill.outputKgPerDeath;
    steps.push({
      label: 'Per kg',
      expression: `intelligence × (1 + ${formatNumber(kill.offspringDeaths)} offspring) ÷ ${formatNumber(kill.outputKgPerDeath)} kg of food per animal`,
      result: formatNumber(own),
    });
  }
  if (row.wildFishKill > 0) {
    const fishPerKg = row.wildFishDeathsPerKg;
    steps.push({
      label: 'Wild fish for feed (per kg)',
      expression: fishPerKg != null
        ? `${formatNumber(fishPerKg)} fish per kg × ${formatNumber(row.wildFishKill / fishPerKg)} intelligence per fish`
        : 'wild fish killed for fishmeal / fish oil in its feed',
      result: formatNumber(row.wildFishKill),
    });
  }
  if (steps.length === 0) return [{ label: 'Per kg', expression: 'no animals are killed on purpose for this food', result: '0' }];
  if (kill && row.wildFishKill > 0) {
    steps.push({ label: 'Total per kg', expression: `animal + wild fish = ${formatNumber(perKg - row.wildFishKill)} + ${formatNumber(row.wildFishKill)}`, result: formatNumber(perKg) });
  }
  steps.push(perUnitStep(perKg, divisor, unit, row.directKill));
  return steps;
}

/** Working for the years animals spend in captivity. */
export function captiveSentienceMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
  const kill = row.killDetail;
  if (row.captiveSentience == null || !kill) {
    return [{ label: 'Per kg', expression: 'no animals are kept in captivity for this food', result: '0' }];
  }
  const years = kill.captivityYears + kill.offspringDeaths * kill.offspringCaptivityYears;
  const perKg = row.captiveSentience * divisor;
  return [
    { label: 'Years in captivity per animal', expression: `own ${formatNumber(kill.captivityYears)} + ${formatNumber(kill.offspringDeaths)} offspring × ${formatNumber(kill.offspringCaptivityYears)}`, result: formatNumber(years) },
    {
      label: 'Per kg',
      expression: `intelligence ${formatNumber(kill.intelligencePerDeath)} × ${formatNumber(years)} years × ${formatNumber(sliders.captivityMultiplier)} (Captivity slider) ÷ ${formatNumber(kill.outputKgPerDeath)} kg of food per animal`,
      result: formatNumber(perKg),
    },
    perUnitStep(perKg, divisor, unit, row.captiveSentience),
  ];
}

/** Working for sentient harm: accidental deaths plus the intentional kill, weighted by the Kill : Accident slider. */
export function sentientHarmMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
  if (row.sentientHarm == null) return [];
  const detail = row.sentientHarmDetail;
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
  const accidental = sumOf(shown.map(([, score]) => score));
  const intentional = detail.directKillScore + detail.captiveSentienceScore;
  const killMultiplier = sliders.killMultiplier;
  const perKg = row.sentientHarm * divisor;
  const steps: MathStep[] = [];
  if (shown.length > 0) {
    steps.push({ label: 'Accidental deaths (per kg)', expression: shown.map(([name, score]) => `${name} ${formatNumber(score)}`).join(' + '), result: formatNumber(accidental) });
  }
  if (killMultiplier > 0) {
    if (intentional > 0) {
      steps.push({ label: 'Intentional (per kg)', expression: `direct kill ${formatNumber(detail.directKillScore)} + captivity ${formatNumber(detail.captiveSentienceScore)}`, result: formatNumber(intentional) });
    }
    steps.push({
      label: 'Total per kg',
      expression: `intentional + accidental ÷ ${formatNumber(killMultiplier)} (Kill : Accident slider) = ${formatNumber(intentional)} + ${formatNumber(accidental)} ÷ ${formatNumber(killMultiplier)}`,
      result: formatNumber(perKg),
    });
  } else {
    steps.push({ label: 'Total per kg', expression: 'accidental only (intentional harm is dropped at 0×)', result: formatNumber(perKg) });
  }
  steps.push(perUnitStep(perKg, divisor, unit, row.sentientHarm));
  return steps;
}
