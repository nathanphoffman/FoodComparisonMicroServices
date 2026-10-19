/** A text label on the left and a slider filling the rest of the row. */
export function SliderRow({ label, title, children }: { label: React.ReactNode; title?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-sm text-neutral-700" title={title}>
            <span className="shrink-0 w-64">{label}</span>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
