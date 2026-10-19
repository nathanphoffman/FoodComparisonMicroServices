/** A per-kg value divided into Compare By units, shown with at most 1 decimal. */
export function formatPerUnit(value: number, divisor: number): string {
  return (value / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** Small grey note under a divider at the bottom of a tooltip. */
export function TooltipFootnote({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-500 text-xs">{children}</div>;
}

/** Food-specific plain-English explanation from the data (sentient_harm_explanation). */
export function ExplanationNote({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="mt-2 pt-2 border-t border-neutral-700 text-neutral-300 text-xs whitespace-normal w-80">{text}</div>;
}
