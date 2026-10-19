import type { FoodDetails, SourcedFigure } from '@/lib/types';
import { MICRONUTRIENT_KEYS } from '../Types/FoodTableTypes';
import { MICRONUTRIENT_INFO } from '../nutrition/FoodTableCalculations';
import { fieldLabel } from './FoodDetailFields';

/** A figure's plain-English explanation, then each sourced input behind it. */
export function FigureSources({ explanation, fields, sources }: {
  explanation: string;
  /** null while the sources are still loading */
  fields: string[] | null;
  sources: FoodDetails['sources'];
}) {
  return (
    <div className="space-y-4">
      <p className="text-neutral-600">{explanation}</p>
      {fields == null
        ? <p className="text-neutral-400">Loading sources…</p>
        : fields.length === 0
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
  ...MICRONUTRIENT_KEYS.map((key): [string, string, string, number] =>
    [key, MICRONUTRIENT_INFO[key].label, ` ${MICRONUTRIENT_INFO[key].unit}`, 100]),
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
