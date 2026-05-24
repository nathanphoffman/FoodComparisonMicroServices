import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDb, rowsToObjects } from '@/lib/db';
import type { Food, Plant, Animal, ISourced } from '@/lib/types';

function firstValue(field: ISourced<number>[] | null | unknown): number | null {
  if (!field) return null;
  const arr = typeof field === 'string' ? JSON.parse(field) as ISourced<number>[] : field as ISourced<number>[];
  return arr[0]?.value ?? null;
}

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FoodPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();

  const foodResult = db.exec('SELECT * FROM foods WHERE slug = :slug', {
    ':slug': slug,
  });
  if (!foodResult.length) notFound();

  const food = rowsToObjects(foodResult)[0] as unknown as Food;
  const nutrition = (JSON.parse(food.nutrition as unknown as string) as Food['nutrition'])[0].value;

  let detail: Plant | Animal | null = null;
  if (food.type === 'plant') {
    const plantQueryResult = db.exec('SELECT * FROM plants WHERE food_id = :id', { ':id': food.id });
    detail = (rowsToObjects(plantQueryResult)[0] as unknown as Plant) ?? null;
  } else if (food.type === 'animal') {
    const animalQueryResult = db.exec('SELECT * FROM animals WHERE food_id = :id', { ':id': food.id });
    detail = (rowsToObjects(animalQueryResult)[0] as unknown as Animal) ?? null;
  }

  const GRAMS_PER_HUNDRED = 100;
  const MILLIGRAMS_PER_GRAM = 1000;
  const formatNutrientPer100g = (gramsPerGram: number) => (gramsPerGram * GRAMS_PER_HUNDRED).toFixed(1) + 'g';

  return (
    <div>
      <p>
        <Link href="/foods">&larr; All foods</Link>
      </p>

      <h1>{food.name}</h1>
      <p>Type: {food.type}</p>

      <h2>Nutrition (per 100g)</h2>
      <table>
        <tbody>
          <tr><td>Calories</td><td>{(nutrition.calories * GRAMS_PER_HUNDRED).toFixed(0)} kcal</td></tr>
          <tr><td>Fat</td><td>{formatNutrientPer100g(nutrition.fat)}</td></tr>
          <tr><td>Saturated fat</td><td>{formatNutrientPer100g(nutrition.sat_fat)}</td></tr>
          {nutrition.trans_fat != null && <tr><td>Trans fat</td><td>{formatNutrientPer100g(nutrition.trans_fat)}</td></tr>}
          <tr><td>Protein</td><td>{formatNutrientPer100g(nutrition.protein)}</td></tr>
          <tr><td>Fiber</td><td>{formatNutrientPer100g(nutrition.fiber)}</td></tr>
          {nutrition.carbs != null && <tr><td>Total carbs</td><td>{formatNutrientPer100g(nutrition.carbs)}</td></tr>}
          {nutrition.sugar != null && <tr><td>Sugar</td><td>{formatNutrientPer100g(nutrition.sugar)}</td></tr>}
          {nutrition.sodium != null && <tr><td>Sodium</td><td>{(nutrition.sodium * GRAMS_PER_HUNDRED * MILLIGRAMS_PER_GRAM).toFixed(0)} mg</td></tr>}
          {nutrition.cholesterol != null && <tr><td>Cholesterol</td><td>{(nutrition.cholesterol * GRAMS_PER_HUNDRED * MILLIGRAMS_PER_GRAM).toFixed(0)} mg</td></tr>}
        </tbody>
      </table>

      {food.type === 'plant' && detail && (
        <>
          <h2>Environmental data</h2>
          <table>
            <tbody>
              {firstValue((detail as Plant).yield_kg_ha) != null && (
                <tr><td>Yield</td><td>{firstValue((detail as Plant).yield_kg_ha)} kg/ha</td></tr>
              )}
              {firstValue((detail as Plant).water_per_kg) != null && (
                <tr><td>Water use</td><td>{firstValue((detail as Plant).water_per_kg)} L/kg</td></tr>
              )}
              {firstValue((detail as Plant).emissions_per_kg) != null && (
                <tr><td>GHG emissions</td><td>{firstValue((detail as Plant).emissions_per_kg)} kg CO₂e/kg</td></tr>
              )}
              {firstValue((detail as Plant).pesticide_kg_ha) != null && (
                <tr><td>Pesticide use</td><td>{firstValue((detail as Plant).pesticide_kg_ha)} kg/ha</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {food.type === 'animal' && detail && (
        <>
          <h2>Animal data</h2>
          <table>
            <tbody>
              {firstValue((detail as Animal).neuron_count) != null && (
                <tr><td>Neuron count</td><td>{firstValue((detail as Animal).neuron_count)?.toLocaleString()}</td></tr>
              )}
              {firstValue((detail as Animal).weight_kg) != null && (
                <tr><td>Live weight</td><td>{firstValue((detail as Animal).weight_kg)} kg</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
