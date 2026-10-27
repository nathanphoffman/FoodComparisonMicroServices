import { getNormalizedDb, rowsToObjects } from '@/lib/db';
import type { Food } from '@/lib/types';

// The foods tagged "common" in the world region, with the columns the foods list needs.
const COMMON_FOODS_QUERY = `SELECT food_id, is_feed, slug, name, type, tags, human_food,
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
  AND    region = 'world'
  AND    EXISTS (
    SELECT 1 FROM json_each(tags) WHERE value = 'common'
  )

`;

export async function loadCommonFoods(): Promise<Food[]> {
  const db = await getNormalizedDb();

  return rowsToObjects(db.exec(COMMON_FOODS_QUERY)) as unknown as Food[];
}
