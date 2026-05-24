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

export function Tooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-block">
      <span className="underline decoration-dashed decoration-neutral-400 underline-offset-2 cursor-help">
        {children}
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 hidden group-hover/tip:block">
        <div className="bg-neutral-900 text-neutral-100 text-xs rounded-lg px-3 py-2.5 shadow-xl whitespace-nowrap">
          {content}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900" />
      </div>
    </span>
  );
}
