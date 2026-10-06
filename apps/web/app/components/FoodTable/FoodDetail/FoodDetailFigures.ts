import type { ColConfig, RawFood } from '../FoodTableTypes';
import type { ScoredRow } from '../FoodTableSort';
import { formatIntelligenceValue } from '../FoodTableCalculations';
import {
  type Tone,
  getEmissionsTone, getImprovementTone, getIntelligenceTone, getLandUseTone,
  getNutritionScoreTone, getSentientHarmTone, getWaterTone,
} from '../FoodTableStyles';

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
    value: row => row.nutrition_score,
    format: oneDecimal,
    tone: getNutritionScoreTone,
    fields: () => ['nutrition'],
    explanation: () => 'Score per 100 kcal: protein, fibre and vitamins/minerals/omega-3 (1 point per full daily value, 2 for vitamin D, calcium, potassium and EPA+DHA) add points; saturated fat, free sugar and sodium take them away.',
  },
  {
    key: 'emissions',
    value: row => row.emissions,
    format: oneDecimal,
    tone: getEmissionsTone,
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
    value: row => row.land_use,
    format: oneDecimal,
    tone: getLandUseTone,
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
    value: row => row.direct_kill,
    format: formatIntelligenceValue,
    tone: getIntelligenceTone,
    fields: food => food.type === 'animal'
      ? ['neuron_count', 'weight_kg', 'yield_fraction', 'lifetime_output_kg', 'offspring_deaths_per_animal', 'feed:fishmeal', 'feed:fish-oil']
      : ['wild_fish_kg_per_kg', 'wild_fish_neuron_count', 'wild_fish_weight_kg', 'wild_fish_lifespan_years'],
    explanation: () => 'Animals killed on purpose per unit of food, each weighted by an intelligence score from its neuron count and body weight. Includes offspring killed and wild fish caught for feed.',
  },
  {
    key: 'water',
    value: row => row.water,
    format: value => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    tone: getWaterTone,
    fields: food => food.type === 'animal'
      ? ['pasture_green_water_l_per_ha', 'pasture_ha_per_kg_output', 'feed:']
      : ['water_per_kg', 'green_water_per_kg', 'blue_water_per_kg', 'grey_water_per_kg', 'cooked_weight_ratio', 'processing_water_per_kg', 'ingredient:'],
    explanation: food => food.type === 'animal'
      ? 'Rainwater used by its pasture plus the water to grow its feed. Green and grey water are weighted by the water sliders.'
      : 'Blue (irrigation) water counts in full; green (rain) and grey (pollution-dilution) water are weighted by the water sliders.',
  },
  {
    key: 'captiveSentience',
    value: row => row.captive_sentience,
    format: formatIntelligenceValue,
    tone: getSentientHarmTone,
    fields: () => ['neuron_count', 'weight_kg', 'lifetime_output_kg', 'offspring_deaths_per_animal', 'offspring_captivity_years'],
    explanation: () => "Years animals spend in captivity per unit of food, weighted by intelligence. The producing animal's own years in captivity are a fixed model value per species; offspring years are sourced below.",
  },
  {
    key: 'sentientHarm',
    value: row => row.sentient_harm,
    format: formatIntelligenceValue,
    tone: getSentientHarmTone,
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
    value: row => row.final_score,
    format: value => `${value.toFixed(1)}x`,
    tone: getImprovementTone,
    fields: () => [],
    explanation: () => 'Combines every other figure against the reference food, using the priority sliders. It has no sources of its own — click the other figures to see theirs.',
  },
];

/** The food's source fields for a figure, expanding groups like 'feed:' in data order. */
export function matchFields(patterns: string[], available: string[]): string[] {
  const matched: string[] = [];
  for (const pattern of patterns) {
    const hits = pattern.endsWith(':')
      ? available.filter(field => field.startsWith(pattern))
      : available.filter(field => field === pattern);
    for (const hit of hits) if (!matched.includes(hit)) matched.push(hit);
  }
  return matched;
}

const FIELD_LABELS: Record<string, string> = {
  nutrition:                    'Nutrition',
  yield_kg_ha:                  'Yield (kg per ha)',
  yield_fraction:               'Edible share',
  cooked_weight_ratio:          'Cooked weight ratio (g cooked per g dry)',
  water_per_kg:                 'Water (L per kg)',
  green_water_per_kg:           'Green water — rain (L per kg)',
  blue_water_per_kg:            'Blue water — irrigation (L per kg)',
  grey_water_per_kg:            'Grey water — pollution dilution (L per kg)',
  emissions_per_kg:             'Published emissions (kg CO₂e per kg)',
  farm_gate_emissions_per_kg:   'Farm-gate emissions, used when fed to animals (kg CO₂e per kg)',
  processing_emissions_per_kg:  'Processing emissions (kg CO₂e per kg)',
  processing_water_per_kg:      'Processing water (L per kg)',
  pesticide_kg_ha:              'Pesticide use, all compounds (kg per ha)',
  neuron_count:                 'Neurons',
  weight_kg:                    'Body weight (kg)',
  lifetime_output_kg:           'Food produced per animal (kg)',
  offspring_deaths_per_animal:  'Offspring killed per animal',
  offspring_captivity_years:    'Offspring time in captivity (years)',
  pasture_ha_per_kg_output:     'Grazing land (ha per kg)',
  pasture_green_water_l_per_ha: 'Pasture rainwater (L per ha per year)',
  native_fraction:              'Share of grazing land that was native habitat',
  ch4_kg_per_kg_output:         'Methane (kg CH₄ per kg)',
  n2o_kg_per_kg_output:         'Nitrous oxide (kg N₂O per kg)',
  co2_kg_per_kg_output:         'Other CO₂ (kg per kg)',
  bycatch_amount:               'Bycatch (kg per kg landed)',
  availability_gg:              'Production (Gg per year)',
  wild_fish_kg_per_kg:          'Wild fish caught (kg per kg)',
  wild_fish_neuron_count:       'Neurons per wild fish',
  wild_fish_weight_kg:          'Weight per wild fish (kg)',
  wild_fish_lifespan_years:     'Wild fish lifespan (years)',
};

export function fieldLabel(field: string): string {
  const [group, name] = field.split(':');
  if (name != null) {
    if (group === 'feed')       return `Feed: ${name} (kg per kg)`;
    if (group === 'pesticide')  return `Pesticide: ${name} (kg per ha)`;
    if (group === 'ingredient') return `Ingredient: ${name} (kg per kg)`;
  }
  return FIELD_LABELS[field] ?? field.replaceAll('_', ' ');
}
