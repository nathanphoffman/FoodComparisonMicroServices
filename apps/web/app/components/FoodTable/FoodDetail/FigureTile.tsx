import type { FoodDetails } from '@/lib/types';
import type { RawFood } from '../FoodTableTypes';
import type { ScoredRow } from '../FoodTableSort';
import { TILE_COLORS } from '../FoodTableStyles';
import { FIGURES } from './FoodDetailFigures';
import { matchFields } from './FoodDetailFields';
import { figureMath, type MathContext } from './FoodDetailMath';
import { FigureMath } from './FigureMath';
import { FigureSources } from './FigureSources';

type Props = {
  figure: typeof FIGURES[number];
  /** Column label as shown in the table header. */
  label: string;
  food: RawFood;
  scoredRow: ScoredRow | undefined;
  mathContext: MathContext;
  details: FoodDetails | null;
  isOpen: boolean;
  onToggle: () => void;
};

/** One figure as a coloured row that expands to show its working and the sources behind it. */
export function FigureTile({ figure, label, food, scoredRow, mathContext, details, isOpen, onToggle }: Props) {
  const value = scoredRow ? figure.value(scoredRow) : null;
  const tone = value == null || figure.tone == null ? 'neutral' : figure.tone(value);
  return (
    <div className={`overflow-hidden rounded-lg border ${TILE_COLORS[tone]}`}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <span className="min-w-0 flex-1 text-[11px] font-medium uppercase leading-tight tracking-wide opacity-80">
          {label}
        </span>
        <span className="text-base font-semibold tabular-nums">
          {value == null ? '—' : value === 0 && figure.tone ? 'None' : figure.format(value)}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none" aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Animates open/closed by easing the row's height from 0fr to 1fr */}
      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 border-t border-black/5 bg-white px-3 py-3 text-sm leading-relaxed text-neutral-700">
            <FigureMath steps={figureMath(figure.key, food, scoredRow, mathContext)} />
            <FigureSources
              explanation={figure.explanation(food)}
              fields={details ? matchFields(figure.fields(food), Object.keys(details.sources)) : null}
              sources={details?.sources ?? {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
