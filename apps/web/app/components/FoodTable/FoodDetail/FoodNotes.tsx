import type { FoodDetails } from '@/lib/types';

function LoadingNotes() {
  return (
    <div className="flex items-center gap-2 text-neutral-400" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" aria-hidden="true" />
      Loading notes…
    </div>
  );
}

function Notes({ notes }: { notes: string | null }) {
  if (!notes) return <p className="text-neutral-400">No notes for this food yet.</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">How we got these numbers</h3>
      {/* A blank line (newline, optional spaces, newline) in the notes starts a new paragraph. */}
      {notes.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
  );
}

/** Under the figures: the food's notes, or why they're not there (still loading, or failed). */
export function NotesSection({ details, loadError }: { details: FoodDetails | null; loadError: string | null }) {
  return (
    <div className="mt-5 text-sm leading-relaxed text-neutral-700">
      {loadError && <p className="text-red-600">Couldn't load notes and sources: {loadError}</p>}
      {!loadError && !details && <LoadingNotes />}
      {details && <Notes notes={details.notes} />}
    </div>
  );
}
