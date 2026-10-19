export function TooltipSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-neutral-300 mb-1.5">{title}</div>
      {children}
    </div>
  );
}

export function TooltipRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-neutral-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
