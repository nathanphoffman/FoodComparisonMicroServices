import { NextResponse } from 'next/server';
import { getDb, rowsToObjects } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const allFoodsQueryResult = db.exec('SELECT * FROM foods WHERE human_food = 1 ORDER BY name');
  const foods = rowsToObjects(allFoodsQueryResult);
  return NextResponse.json(foods);
}
