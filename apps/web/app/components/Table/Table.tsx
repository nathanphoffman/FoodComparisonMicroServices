import { SortIcon } from './SortIcon';

type Header = {
  label: string;
  sorted?: 'asc' | 'desc';
  onSort?: () => void;
};

export function Table({ headers = [], children }: { headers?: Header[], children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.label}
                onClick={header.onSort}
                className={[
                  'bg-neutral-50 border-b border-neutral-200 first:rounded-tl-xl last:rounded-tr-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors text-left',
                  header.sorted ? 'text-neutral-800' : 'text-neutral-500',
                  header.onSort ? 'cursor-pointer select-none hover:bg-neutral-100' : '',
                ].join(' ')}
              >
                {header.onSort ? (
                  <span className="inline-flex items-center gap-1.5">
                    {header.label}
                    <SortIcon dir={header.sorted} />
                  </span>
                ) : header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
