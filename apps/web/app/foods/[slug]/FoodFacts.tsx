import type { Food, Plant, Animal } from '@/lib/types';
import { firstValue } from './loadFood';

const GRAMS_PER_HUNDRED = 100;
const MILLIGRAMS_PER_GRAM = 1000;

type Fact = [label: string, value: string | null];

const formatGrams = (gramsPerGram: number | null | undefined): string | null =>
  gramsPerGram == null ? null : `${(gramsPerGram * GRAMS_PER_HUNDRED).toFixed(1)}g`;

const formatMilligrams = (gramsPerGram: number | null | undefined): string | null =>
  gramsPerGram == null ? null : `${(gramsPerGram * GRAMS_PER_HUNDRED * MILLIGRAMS_PER_GRAM).toFixed(0)} mg`;

/** A heading and a table of label / value rows; rows without a value are left out. */
function FactsTable({ title, facts }: { title: string; facts: Fact[] }) {
  return (
    <>
      <h2>{title}</h2>
      <table>
        <tbody>
          {facts.filter(([, value]) => value !== null).map(([label, value]) => (
            <tr key={label}><td>{label}</td><td>{value}</td></tr>
          ))}

        </tbody>
      </table>
    </>
  );
}

/** Per-100 g nutrition. The stored amounts are per gram. */
export function NutritionFacts({ nutrition }: { nutrition: Food['nutrition'][number]['value'] }) {
  return (
    <FactsTable title="Nutrition (per 100g)" facts={[
      ['Calories', `${(nutrition.calories * GRAMS_PER_HUNDRED).toFixed(0)} kcal`],
      ['Fat', formatGrams(nutrition.fat)],
      ['Saturated fat', formatGrams(nutrition.sat_fat)],
      ['Trans fat', formatGrams(nutrition.trans_fat)],
      ['Protein', formatGrams(nutrition.protein)],
      ['Fiber', formatGrams(nutrition.fiber)],
      ['Total carbs', formatGrams(nutrition.carbs)],
      ['Sugar', formatGrams(nutrition.sugar)],
      ['Sodium', formatMilligrams(nutrition.sodium)],
      ['Cholesterol', formatMilligrams(nutrition.cholesterol)],
    ]} />
  );
}

const withUnit = (value: number | null, unit: string): string | null => value === null ? null : `${value} ${unit}`;

export function PlantFacts({ plant }: { plant: Plant }) {
  return (
    <FactsTable title="Environmental data" facts={[
      ['Yield', withUnit(firstValue(plant.yield_kg_ha), 'kg/ha')],
      ['Water use', withUnit(firstValue(plant.water_per_kg), 'L/kg')],
      ['GHG emissions', withUnit(firstValue(plant.emissions_per_kg), 'kg CO₂e/kg')],
      ['Pesticide use', withUnit(firstValue(plant.pesticide_kg_ha), 'kg/ha')],
    ]} />
  );
}

export function AnimalFacts({ animal }: { animal: Animal }) {
  const neurons = firstValue(animal.neuron_count);

  return (
    <FactsTable title="Animal data" facts={[
      ['Neuron count', neurons === null ? null : neurons.toLocaleString()],
      ['Live weight', withUnit(firstValue(animal.weight_kg), 'kg')],
    ]} />
  );
}
