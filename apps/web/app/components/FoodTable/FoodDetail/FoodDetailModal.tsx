'use client';

import { useState } from 'react';
import type { RawFood } from '../FoodTableTypes';
import type { ScoredRow } from '../FoodTableSort';
import { FIGURES, type FigureKey } from './FoodDetailFigures';
import type { MathContext } from './FoodDetailMath';
import { FigureTile } from './FigureTile';
import { LoadingNotes, Notes } from './FoodNotes';
import { useFoodDetails } from './useFoodDetails';
import { useModalLock } from './useModalLock';

type Props = {
  food: RawFood;
  scoredRow: ScoredRow | undefined;
  /** Column labels as shown in the table header (they change with the Compare By unit). */
  labels: Record<FigureKey, string>;
  /** Sliders and reference food, for the step-by-step working shown in each row. */
  mathContext: MathContext;
  onClose: () => void;
};

/** Pops up when a food name is clicked: the food's figures as coloured rows that
 *  expand to show the sources behind each one, then the food's notes. */
export function FoodDetailModal({ food, scoredRow, labels, mathContext, onClose }: Props) {
  const { details, loadError } = useFoodDetails(food.slug);
  const [selected, setSelected] = useState<FigureKey | null>(null);
  useModalLock(onClose);

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
          <div className="space-y-1.5">
            {FIGURES.map(figure => (
              <FigureTile
                key={figure.key}
                figure={figure}
                label={labels[figure.key]}
                food={food}
                scoredRow={scoredRow}
                mathContext={mathContext}
                details={details}
                isOpen={figure.key === selected}
                onToggle={() => setSelected(figure.key === selected ? null : figure.key)}
              />
            ))}
          </div>

          <div className="mt-5 text-sm leading-relaxed text-neutral-700">
            {loadError && <p className="text-red-600">Couldn't load notes and sources: {loadError}</p>}
            {!loadError && !details && <LoadingNotes />}
            {details && <Notes notes={details.notes} />}
          </div>
        </div>
      </div>
    </div>
  );
}
