import Link from 'next/link';
import { FoodTable } from './components/FoodTable/FoodTable';

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">Food Comparison</h1>
      <p>
        Explore foods by their nutritional profiles, environmental footprints,
        and the ethical dimensions of how they are produced.
      </p>
      <Link href="/foods">Browse all foods &rarr;</Link>
      {/* FoodTable fetches its own data from the C# API and scores in-browser via Rust WASM */}
      <FoodTable />
    </div>
  );
}
