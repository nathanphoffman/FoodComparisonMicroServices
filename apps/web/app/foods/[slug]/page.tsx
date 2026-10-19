import Link from 'next/link';
import type { Plant, Animal } from '@/lib/types';
import { loadFood } from './loadFood';
import { NutritionFacts, PlantFacts, AnimalFacts } from './FoodFacts';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FoodPage({ params }: Props) {
  const { slug } = await params;
  const { food, nutrition, detail } = await loadFood(slug);

  return (
    <div>
      <p>
        <Link href="/foods">&larr; All foods</Link>
      </p>

      <h1>{food.name}</h1>
      <p>Type: {food.type}</p>

      {food.notes && (
        <>
          <h2>How we got these numbers</h2>
          {food.notes.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </>
      )}

      <NutritionFacts nutrition={nutrition} />
      {food.type === 'plant' && detail && <PlantFacts plant={detail as Plant} />}
      {food.type === 'animal' && detail && <AnimalFacts animal={detail as Animal} />}
    </div>
  );
}
