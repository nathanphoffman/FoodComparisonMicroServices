export function SortIcon({ dir }: { dir?: 'asc' | 'desc' }) {
  return (
    <span className={`transition-opacity ${dir ? 'opacity-100' : 'opacity-30'}`}>
      {dir === 'desc' ? '↓' : '↑'}
    </span>
  );
}
