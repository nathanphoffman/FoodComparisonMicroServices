export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-t border-neutral-100 hover:bg-neutral-50 transition-colors ${className ?? ''}`}>
      {children}
    </tr>
  );
}
