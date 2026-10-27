import type { ColConfig, RawFood } from '../../types/FoodTableTypes';
import type { ScoredRow } from '../../types/FoodTableTypes';
import { formatIntelligenceValue } from '../../nutrition/FoodTableCalculations';
import {
  type Tone,
  getTone,
} from '../../rows/FoodTableStyles';

export type FigureKey = Exclude<ColConfig['key'], 'name' | 'rank'>;

type Figure = {
  key: FigureKey;

  /** The figure's value for this food, from the WASM-scored row. */
  value: (row: ScoredRow) => number | null;
  format: (value: number) => string;

  /** null = no good/bad scale (shown neutral). */
  tone: ((value: number) => Tone) | null;

  /** Source fields behind the figure, in display order. A trailing ':' matches a group
   *  (e.g. 'feed:' matches every feed row). Fields the food doesn't have are skipped. */
  fields: (food: RawFood) => string[];

  /** One or two sentences on how the figure is built, shown above its sources. */
  explanation: (food: RawFood) => string;
};

const isComposite = (food: RawFood) => food.tags.includes('composite');

const oneDecimal = (value: number) => value.toFixed(1);

// Every column in the table except the food name, in table order.
export const FIGURES: Figure[] = [
  {
    key: 'nutritionScore',
    value: row => row.nutritionScore,
    format: oneDecimal,
    tone: value => getTone('nutritionScore', value),
    fields: () => ['nutrition'],
    explanation: () => 'Score per 100 kcal: protein, fibre and vitamins/minerals/omega-3 (1 point per full daily value, 2 for vitamin D, calcium, potassium and EPA+DHA) add points; saturated fat, free sugar and sodium take them away.',
  },
  {
    key: 'emissions',
    value: row => row.emissions,
    format: oneDecimal,
    tone: value => getTone('emissions', value),
    fields: food => food.type === 'animal'
      ? ['ch4_kg_per_kg_output', 'n2o_kg_per_kg_output', 'co2_kg_per_kg_output', 'feed:', 'lifetime_output_kg', 'emissions_per_kg']
      : ['emissions_per_kg', 'farm_gate_emissions_per_kg', 'cooked_weight_ratio', 'processing_emissions_per_kg', 'ingredient:'],
    explanation: food => food.type === 'animal'
      ? "The animal's own methane, nitrous oxide and other CO₂, plus the emissions of every feed crop it eats. A published total, where listed, is for comparison only."
      : isComposite(food)
        ? "Each ingredient's farm emissions (from its own entry) plus the factory, packaging and transport emissions below."
        : 'Greenhouse gas emissions per kg, including land-use change where the source counts it.',
  },
  {
    key: 'landUse',
    value: row => row.landUse,
    format: oneDecimal,
    tone: value => getTone('landUse', value),
    fields: food => food.type === 'animal'
      ? ['pasture_ha_per_kg_output', 'feed:', 'yield_fraction', 'lifetime_output_kg']
      : ['yield_kg_ha', 'yield_fraction', 'cooked_weight_ratio', 'ingredient:'],
    explanation: food => food.type === 'animal'
      ? 'Grazing land plus the cropland to grow its feed, weighted by the Land Use sliders for the kind of land used.'
      : isComposite(food)
        ? "Land for each ingredient, from the ingredient's own yield, weighted by the Land Use sliders."
        : 'Land per kg = 1 ÷ yield, weighted by the Land Use sliders for the kind of land it grows on.',
  },
  {
    key: 'directKill',
    value: row => row.directKill,
    format: formatIntelligenceValue,
    tone: value => getTone('directKill', value),
    fields: food => food.type === 'animal'
      ? ['neuron_count', 'weight_kg', 'yield_fraction', 'lifetime_output_kg', 'offspring_deaths_per_animal', 'feed:fishmeal', 'feed:fish-oil']
      : ['wild_fish_kg_per_kg', 'wild_fish_neuron_count', 'wild_fish_weight_kg', 'wild_fish_lifespan_years'],
    explanation: () => 'Animals killed on purpose per unit of food, each weighted by an intelligence score from its neuron count and body weight. Includes offspring killed and wild fish caught for feed.',
  },
  {
    key: 'water',
    value: row => row.water,
    format: value => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    tone: value => getTone('water', value),
    fields: food => food.type === 'animal'
      ? ['pasture_green_water_l_per_ha', 'pasture_ha_per_kg_output', 'feed:']
      : ['water_per_kg', 'green_water_per_kg', 'blue_water_per_kg', 'grey_water_per_kg', 'cooked_weight_ratio', 'processing_water_per_kg', 'ingredient:'],
    explanation: food => food.type === 'animal'
      ? 'Rainwater used by its pasture plus the water to grow its feed. Green and grey water are weighted by the water sliders.'
      : 'Blue (irrigation) water counts in full; green (rain) and grey (pollution-dilution) water are weighted by the water sliders.',
  },
  {
    key: 'captiveSentience',
    value: row => row.captiveSentience,
    format: formatIntelligenceValue,
    tone: value => getTone('sentientHarm', value),
    fields: () => ['neuron_count', 'weight_kg', 'lifetime_output_kg', 'offspring_deaths_per_animal', 'offspring_captivity_years'],
    explanation: () => "Years animals spend in captivity per unit of food, weighted by intelligence. The producing animal's own years in captivity are a fixed model value per species; offspring years are sourced below.",
  },
  {
    key: 'sentientHarm',
    value: row => row.sentientHarm,
    format: formatIntelligenceValue,
    tone: value => getTone('sentientHarm', value),
    fields: food => food.type === 'animal'
      ? ['feed:', 'pasture_ha_per_kg_output', 'native_fraction', 'bycatch_amount', 'neuron_count', 'weight_kg', 'lifetime_output_kg', 'offspring_deaths_per_animal']
      : ['yield_kg_ha', 'pesticide_kg_ha', 'pesticide:', 'ingredient:'],
    explanation: food => food.type === 'animal'
      ? 'Direct kill and captivity, plus wildlife killed by its feed crops (pesticides and land clearing), its pasture and any bycatch.'
      : 'Insects, bees and soil life killed by pesticides, plus wildlife displaced by clearing the land, per unit of food.',
  },
  {
    key: 'availability',
    value: row => row.availability,
    format: value => value.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    tone: null,
    fields: () => ['availability_gg', 'yield_kg_ha', 'ingredient:'],
    explanation: food => isComposite(food)
      ? "How much of this could be produced: the product's own volume blended with its ingredients' world supply, per unit of land."
      : 'How much of this could be produced: world production per unit of land it needs.',
  },
  {
    key: 'finalScore',
    value: row => row.finalScore,
    format: value => `${value.toFixed(1)}x`,
    tone: value => getTone('improvement', value),
    fields: () => [],
    explanation: () => 'Combines every other figure against the reference food, using the priority sliders. It has no sources of its own — click the other figures to see theirs.',
  },
];
