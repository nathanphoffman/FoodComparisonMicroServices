import Link from 'next/link';
import { getNormalizedDb, rowsToObjects } from '@/lib/db';
import type { Food } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function FoodsPage() {
  const db = await getNormalizedDb();

  const humanFoodsQueryResult = db.exec(`SELECT food_id, is_feed, slug, name, type, tags, human_food,
         calories, fat, sat_fat, protein, fiber,
         sodium, carbs, sugar, cholesterol, trans_fat,
         yield_kg_ha, water_per_kg, soil_erosion, pesticide_kg_ha,
         fertilizer_kg_ha, emissions_per_kg, tillage_events_per_year, co2_capture_kg_ha_yr,
         pesticide_freshwater_paf, pesticide_terrestrial_paf, pesticide_insect_paf, pesticide_bee_hazard, pesticide_kg_per_kg_food,
         neuron_count, weight_kg, yield_fraction, pasture_ha_per_kg_output,
         native_fraction, bycatch_amount,
         ch4_kg_per_kg_output, n2o_kg_per_kg_output, co2_kg_per_kg_output
  FROM   foods_normalized
  WHERE  is_feed = 0
  AND    EXISTS (
    SELECT 1 FROM json_each(tags) WHERE value = 'common'
  )
`);

  const foods = rowsToObjects(humanFoodsQueryResult) as unknown as Food[];

  const plants = foods.filter((food) => food.type === 'plant');
  const animals = foods.filter((food) => food.type === 'animal');

  return (
    <div>
      <h1>Foods</h1>

      <section>
        <h2>Plants</h2>
        <ul>
          {plants.map((food) => (
            <li key={food.slug}>
              <Link href={`/foods/${food.slug}`}>{food.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Animals</h2>
        <ul>
          {animals.map((food) => (
            <li key={food.slug}>
              <Link href={`/foods/${food.slug}`}>{food.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
