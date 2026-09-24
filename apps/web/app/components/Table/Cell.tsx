export function Cell({ children, align = 'left' }: { children: React.ReactNode, align?: 'left' | 'right' }) {
  return (
    <td className={`px-3 py-3 text-sm text-neutral-700 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </td>
  );
}
