export function LoadingNotes() {
  return (
    <div className="flex items-center gap-2 text-neutral-400" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" aria-hidden="true" />
      Loading notes…
    </div>
  );
}

export function Notes({ notes }: { notes: string | null }) {
  if (!notes) return <p className="text-neutral-400">No notes for this food yet.</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">How we got these numbers</h3>
      {notes.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
  );
}
