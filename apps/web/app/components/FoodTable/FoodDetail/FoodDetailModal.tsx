'use client';

import { useEffect, useState } from 'react';
import type { FoodDetails, SourcedFigure } from '@/lib/types';
import type { RawFood } from '../FoodTableTypes';
import type { ScoredRow } from '../FoodTableSort';
import { TILE_COLORS } from '../FoodTableStyles';
import { FIGURES, type FigureKey, fieldLabel, matchFields } from './FoodDetailFigures';

type Props = {
  food: RawFood;
  scoredRow: ScoredRow | undefined;
  /** Column labels as shown in the table header (they change with the Compare By unit). */
  labels: Record<FigureKey, string>;
  onClose: () => void;
};

/** Pops up when a food name is clicked: the food's figures as coloured tiles, then
 *  its notes — or, once a tile is clicked, the sources behind that figure. */
export function FoodDetailModal({ food, scoredRow, labels, onClose }: Props) {
  const [details, setDetails] = useState<FoodDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FigureKey | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/foods/${encodeURIComponent(food.slug)}/details`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<FoodDetails>;
      })
      .then(setDetails)
      .catch(error => { if (!controller.signal.aborted) setLoadError(String(error)); });
    return () => controller.abort();
  }, [food.slug]);

  // Escape closes; the page behind doesn't scroll while the modal is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const selectedFigure = FIGURES.find(figure => figure.key === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-detail-title"
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 id="food-detail-title" className="text-base font-semibold text-neutral-900">{food.name}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Click a figure for sourcing</p>
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FIGURES.map(figure => {
              const value = scoredRow ? figure.value(scoredRow) : null;
              const tone = value == null || figure.tone == null ? 'neutral' : figure.tone(value);
              const isSelected = figure.key === selected;
              return (
                <button
                  key={figure.key}
                  onClick={() => setSelected(isSelected ? null : figure.key)}
                  aria-pressed={isSelected}
                  className={[
                    'flex aspect-[4/3] flex-col justify-between rounded-xl border p-3 text-left transition sm:aspect-[16/10]',
                    'hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    TILE_COLORS[tone],
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
                  ].join(' ')}
                >
                  <span className="text-[11px] font-medium uppercase leading-tight tracking-wide opacity-75">
                    {labels[figure.key]}
                  </span>
                  <span className="text-xl font-semibold tabular-nums sm:text-2xl">
                    {value == null ? '—' : value === 0 && figure.tone ? 'None' : figure.format(value)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 text-sm leading-relaxed text-neutral-700">
            {loadError && <p className="text-red-600">Couldn't load notes and sources: {loadError}</p>}
            {!loadError && !details && <p className="text-neutral-400">Loading…</p>}
            {details && (selectedFigure
              ? <FigureSources
                  label={labels[selectedFigure.key]}
                  explanation={selectedFigure.explanation(food)}
                  fields={matchFields(selectedFigure.fields(food), Object.keys(details.sources))}
                  sources={details.sources}
                  onBack={() => setSelected(null)}
                />
              : <Notes notes={details.notes} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Notes({ notes }: { notes: string | null }) {
  if (!notes) return <p className="text-neutral-400">No notes for this food yet.</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">How we got these numbers</h3>
      {notes.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
  );
}

function FigureSources({ label, explanation, fields, sources, onBack }: {
  label: string;
  explanation: string;
  fields: string[];
  sources: FoodDetails['sources'];
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sources: {label}</h3>
        <button onClick={onBack} className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700">
          Back to notes
        </button>
      </div>
      <p className="text-neutral-600">{explanation}</p>
      {fields.length === 0
        ? <p className="text-neutral-400">No sourced inputs recorded for this figure.</p>
        : fields.map(field => (
            <div key={field} className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-800">{fieldLabel(field)}</h4>
              <ul className="space-y-2">
                {sources[field].map((entry, index) => <SourceEntry key={index} entry={entry} />)}
              </ul>
            </div>
          ))
      }
    </div>
  );
}

function SourceEntry({ entry }: { entry: SourcedFigure }) {
  return (
    <li className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-neutral-900">{formatSourcedValue(entry.value)}</span>
        {entry.region && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{entry.region}</span>
        )}
        <span className="text-neutral-500">confidence {entry.confidence}/5</span>
      </div>
      {entry.source.url
        ? <a href={entry.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-words font-medium text-blue-600 hover:underline">{entry.source.title}</a>
        : <p className="mt-1 font-medium text-neutral-700">{entry.source.title}</p>
      }
      {entry.source.note && <p className="mt-1 break-words text-neutral-600">{entry.source.note}</p>}
    </li>
  );
}

const NUTRIENTS: [key: string, label: string, unit: string, scale: number][] = [
  ['calories', 'kcal', '', 100],
  ['protein', 'protein', ' g', 100],
  ['fat', 'fat', ' g', 100],
  ['sat_fat', 'sat. fat', ' g', 100],
  ['carbs', 'carbs', ' g', 100],
  ['fiber', 'fibre', ' g', 100],
  ['sugar', 'sugar', ' g', 100],
  ['sodium', 'sodium', ' mg', 100],
];

/** Numbers as-is (to 4 significant figures); nutrition objects as a per-100 g summary. */
function formatSourcedValue(value: SourcedFigure['value']): string {
  if (typeof value === 'number') return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
  const parts = NUTRIENTS
    .filter(([key]) => value[key] != null)
    .map(([key, label, unit, scale]) => {
      const amount = (value[key] as number) * scale;
      return key === 'calories' ? `${amount.toFixed(0)} ${label}` : `${amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit} ${label}`;
    });
  return `Per 100 g: ${parts.join(', ')}`;
}
