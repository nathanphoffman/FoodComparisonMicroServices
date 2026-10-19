/** Shown above the toolbar when scoring fails; the table keeps its last scores. */
export function ScoringErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div className="flex items-start justify-between gap-3 mb-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <div>
                <span className="font-medium">Scoring error — </span>
                scores may be stale. {message}
            </div>
            <button
                onClick={onDismiss}
                className="shrink-0 text-red-400 hover:text-red-600 leading-none text-base"
                aria-label="Dismiss"
            >✕</button>
        </div>
    );
}
