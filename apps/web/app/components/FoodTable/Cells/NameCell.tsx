import Link from 'next/link';
import { Cell } from '../../Table/Cell';

export function NameCell({ name, slug }: { name: string; slug: string }) {
  if (slug === 'your-meal') {
    return (
      <Cell key="name">
        <span className="font-semibold italic text-blue-700">{name}</span>
      </Cell>
    );
  }
  return (
    <Cell key="name">
      <Link href={`/foods/${slug}`} className="font-medium text-neutral-900 hover:text-blue-600 transition-colors">
        {name}
      </Link>
    </Cell>
  );
}
