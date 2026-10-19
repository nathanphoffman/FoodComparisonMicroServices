import type { RawFood } from '../../types/FoodTableTypes';
import type { ScoredRow } from '../../scoring/FoodTableSort';
import { num, perUnitStep, type MathStep, type MathContext } from './MathShared';

/** Working for the intentional kill: animal deaths plus wild fish used for feed. */
export function directKillMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
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

/** Working for the years animals spend in captivity. */
export function captiveSentienceMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
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

/** Working for sentient harm: accidental deaths plus the intentional kill, weighted by the Kill : Accident slider. */
export function sentientHarmMath(food: RawFood, row: ScoredRow, context: MathContext): MathStep[] {
  const { sliders, unit } = context;
  const divisor = row.divisor;
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
