import { NextResponse } from 'next/server';
import { getDb, rowsToObjects } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = await getDb();

  const foodResult = db.exec('SELECT * FROM foods WHERE slug = :slug', {
    ':slug': slug,
  });

  if (!foodResult.length) {
    return NextResponse.json({ error: 'Food not found' }, { status: 404 });
  }

  const food = rowsToObjects(foodResult)[0];

  if (food.type === 'plant') {
    const plantResult = db.exec(
      'SELECT * FROM plants WHERE food_id = :id',
      { ':id': food.id as number }
    );
    return NextResponse.json({ food, detail: rowsToObjects(plantResult)[0] ?? null });
  }

  if (food.type === 'animal') {
    const animalResult = db.exec(
      'SELECT * FROM animals WHERE food_id = :id',
      { ':id': food.id as number }
    );
    const animalDetail = rowsToObjects(animalResult)[0] ?? null;

    let feedData: Record<string, unknown>[] = [];
    if (animalDetail) {
      const feedResult = db.exec(
        `SELECT af.*, f.name AS plant_name, f.slug AS plant_slug
         FROM animal_feed af
         JOIN plants p ON p.id = af.plant_id
         JOIN foods f ON f.id = p.food_id
         WHERE af.animal_id = :id`,
        { ':id': animalDetail.id as number }
      );
      feedData = rowsToObjects(feedResult);
    }

    return NextResponse.json({ food, detail: animalDetail, feed: feedData });
  }

  return NextResponse.json({ food, detail: null });
}
