import Link from 'next/link';
import { loadCommonFoods } from '@/lib/queries/commonFoods';
import type { Food } from '@/lib/types';

export const dynamic = 'force-dynamic';

function FoodLinks({ title, foods }: { title: string; foods: Food[] }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {foods.map((food) => (
          <li key={food.slug}>
            <Link href={`/foods/${food.slug}`}>{food.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FoodsPage() {
  const foods = await loadCommonFoods();

  return (
    <div>
      <h1>Foods</h1>
      <FoodLinks title="Plants" foods={foods.filter((food) => food.type === 'plant')} />
      <FoodLinks title="Animals" foods={foods.filter((food) => food.type === 'animal')} />
    </div>
  );
}
