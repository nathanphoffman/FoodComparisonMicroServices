export function Row({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
      {children}
    </tr>
  );
}
