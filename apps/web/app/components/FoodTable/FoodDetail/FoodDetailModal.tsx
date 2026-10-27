'use client';

import { useState } from 'react';
import type { RawFood } from '../types/FoodTableTypes';
import type { ScoredRow } from '../types/FoodTableTypes';
import { FIGURES, type FigureKey } from './figures/FoodDetailFigures';
import type { MathContext } from './figures/math/FoodDetailMath';
import { FigureTile } from './figures/FigureTile';
import { NotesSection } from './FoodNotes';
import { FoodDetailHeader } from './FoodDetailHeader';
import { useFoodDetails } from './useFoodDetails';
import { useModalLock } from './useModalLock';

const TITLE_ID = 'food-detail-title';

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
        aria-labelledby={TITLE_ID}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:max-w-2xl sm:rounded-2xl"
      >
        <FoodDetailHeader name={food.name} titleId={TITLE_ID} onClose={onClose} />

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

          <NotesSection details={details} loadError={loadError} />
        </div>
      </div>
    </div>
  );
}
