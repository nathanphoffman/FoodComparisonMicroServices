import { MICRONUTRIENT_INFO } from '../FoodTableCalculations';
import type { Supplement } from './CustomFoodSaved';

const INPUT = 'border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700 bg-white';

/** A positive number from a typed value; 0 when it's empty or not a number. */
export const positiveOrZero = (value: string) => value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;

type Props = {
    supplement: Supplement;
    /** The person's daily need for this nutrient, which a dose entered as a % of need is measured against. */
    dailyNeed: number;
    onChange: (patch: Partial<Supplement>) => void;
    onRemove: () => void;
};

/** One supplement line: dose per pill (in its unit or as % of daily need) and pills per week. */
export function SupplementRow({ supplement, dailyNeed, onChange, onRemove }: Props) {
    const { label, unit } = MICRONUTRIENT_INFO[supplement.key];
    const shown = supplement.percent ? supplement.dose / dailyNeed * 100 : supplement.dose;
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-neutral-600">{label}</span>
            <input
                type="number" min={0} step="any" inputMode="decimal"
                value={shown ? Number(shown.toPrecision(4)) : ''}
                onChange={e => onChange({ dose: supplement.percent ? positiveOrZero(e.target.value) / 100 * dailyNeed : positiveOrZero(e.target.value) })}
                aria-label={`${label} dose`}
                className={`${INPUT} w-20`}
            />
            <select
                value={supplement.percent ? 'percent' : 'unit'}
                onChange={e => onChange({ percent: e.target.value === 'percent' })}
                aria-label={`${label} dose unit`}
                className={`${INPUT} px-1`}
            >
                <option value="unit">{unit}</option>
                <option value="percent">% RDA</option>
            </select>
            <span>per pill ×</span>
            <input
                type="number" min={0} step="any" inputMode="decimal"
                value={supplement.perWeek || ''}
                onChange={e => onChange({ perWeek: positiveOrZero(e.target.value) })}
                aria-label={`${label} pills per week`}
                className={`${INPUT} w-16`}
            />
            <span>per week</span>
            <button
                onClick={onRemove}
                className="text-neutral-400 hover:text-red-500 leading-none"
                aria-label={`Remove ${label}`}
            >✕</button>
        </div>
    );
}
