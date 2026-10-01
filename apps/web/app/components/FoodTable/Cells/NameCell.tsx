import Link from 'next/link';
import { Cell } from '../../Table/Cell';

export function NameCell({ name, slug, onSelect }: { name: string; slug: string; onSelect: (slug: string) => void }) {
  if (slug === 'your-meal') {
    return (
      <Cell key="name">
        <span className="font-semibold italic text-blue-700">{name}</span>
      </Cell>
    );
  }
  return (
    <Cell key="name">
      {/* Opens the detail modal; modifier-clicks still open the food's own page. */}
      <Link
        href={`/foods/${slug}`}
        onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          onSelect(slug);
        }}
        className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-blue-600 hover:decoration-blue-400"
      >
        {name}
      </Link>
    </Cell>
  );
}
