import { notFound } from 'next/navigation';
import { getDb, rowsToObjects } from '@/lib/db';
import type { Food, Plant, Animal, ISourced } from '@/lib/types';

/** The first sourced value of a stored field (a JSON string or already-parsed list), or null when there is none. */
export function firstValue(field: ISourced<number>[] | null | unknown): number | null {
  if (!field) return null;
  const sourced = typeof field === 'string' ? JSON.parse(field) as ISourced<number>[] : field as ISourced<number>[];

  return sourced[0]?.value ?? null;
}

export type FoodWithDetail = {
  food: Food;
  nutrition: Food['nutrition'][number]['value'];

  /** The plant or animal row that goes with the food, when it has one. */
  detail: Plant | Animal | null;
};

/** Loads one food, its first nutrition entry, and its plant or animal row. Shows the not-found page for an unknown slug. */
export async function loadFood(slug: string): Promise<FoodWithDetail> {
  const db = await getDb();
  const foodResult = db.exec('SELECT * FROM foods WHERE slug = :slug', { ':slug': slug });

  if (!foodResult.length) notFound();

  const food = rowsToObjects(foodResult)[0] as unknown as Food;
  const nutrition = (JSON.parse(food.nutrition as unknown as string) as Food['nutrition'])[0].value;

  let detailTable: 'plants' | 'animals' | null = null;

  if (food.type === 'plant') detailTable = 'plants';

  if (food.type === 'animal') detailTable = 'animals';
  const detailResult = detailTable ? db.exec(`SELECT * FROM ${detailTable} WHERE food_id = :id`, { ':id': food.id }) : [];
  const detail = (rowsToObjects(detailResult)[0] as unknown as Plant | Animal | undefined) ?? null;

  return { food, nutrition, detail };
}
