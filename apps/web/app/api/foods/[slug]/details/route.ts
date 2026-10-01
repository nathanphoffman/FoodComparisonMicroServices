import { NextResponse } from 'next/server';
import { getDb, rowsToObjects } from '@/lib/db';
import type { FoodDetails, SourcedFigure } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** A food's notes and every sourced figure behind it, for the food detail modal. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();

  const food = rowsToObjects(db.exec('SELECT id, name, notes FROM foods WHERE slug = :slug', { ':slug': slug }))[0];
  if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  const sourceRows = rowsToObjects(db.exec(
    'SELECT field, sources FROM food_sources WHERE food_id = :id ORDER BY id',
    { ':id': food.id as number },
  ));
  const sources: Record<string, SourcedFigure[]> = Object.fromEntries(
    sourceRows.map(row => [row.field as string, JSON.parse(row.sources as string) as SourcedFigure[]]),
  );

  const details: FoodDetails = { name: food.name as string, notes: (food.notes as string | null) ?? null, sources };
  return NextResponse.json(details);
}
