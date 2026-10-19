import { Slider } from '../../../Inputs/Slider';
import { MAX_DAYS_BETWEEN, MIN_DAYS_BETWEEN, mealsPerDayFor } from '../../nutrition/FoodTableAbsorption';
import { ACTIVITY_LEVELS } from '../../nutrition/FoodTableTargets';
import { MIN_RDA_AGE } from '../../nutrition/FoodTableRda';
import { positiveOrNull, type Saved } from './CustomFoodSaved';

const INPUT = 'border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white';

type Props = { saved: Saved; onChange: (patch: Partial<Saved>) => void };

/** The person's daily calories, sex, age and weight, plus the two sliders that shape the whole-diet numbers. */
export function DietSettingsFields({ saved, onChange }: Props) {
    return (
        <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
                <label className="flex items-center gap-2">
                    Total calories / day
                    <input
                        type="number"
                        min={0}
                        step={50}
                        inputMode="numeric"
                        value={saved.calorieTarget ?? ''}
                        onChange={e => onChange({ calorieTarget: positiveOrNull(e.target.value) })}
                        placeholder="2000"
                        className={`${INPUT} w-24`}
                    />
                </label>
                <label className="flex items-center gap-2">
                    Sex
                    <select
                        value={saved.sex ?? ''}
                        onChange={e => onChange({ sex: e.target.value === 'male' || e.target.value === 'female' ? e.target.value : null })}
                        className={INPUT}
                    >
                        <option value="">Not set</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </label>
                <label className="flex items-center gap-2" title={`Adjusts your daily needs by age (${MIN_RDA_AGE} or older)`}>
                    Age
                    <input
                        type="number"
                        min={MIN_RDA_AGE}
                        max={120}
                        inputMode="numeric"
                        value={saved.age ?? ''}
                        onChange={e => { const age = positiveOrNull(e.target.value); onChange({ age: age && Math.round(age) }); }}
                        className={`${INPUT} w-16`}
                    />
                </label>
                <label className="flex items-center gap-2" title="Scales your vitamin and mineral needs (about weight^0.75) and sets your protein need (0.8 g per kg)">
                    Weight (lb)
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={saved.weightLb ?? ''}
                        onChange={e => onChange({ weightLb: positiveOrNull(e.target.value) })}
                        className={`${INPUT} w-20`}
                    />
                </label>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-700" title="The longest you go without eating a food on this list. The longer the gap, the more of its B12, calcium and vitamin C arrives in one meal, beyond what your body can absorb at once, which lowers the whole-diet % daily need. 0.1 days is 10 meals a day.">
                <span className="shrink-0 w-64">
                    Longest gap without eating a food on this list: {saved.daysBetween.toFixed(1)} {saved.daysBetween === 1 ? 'day' : 'days'}
                    <span className="text-xs text-neutral-500"> (≈{mealsPerDayFor(saved.daysBetween).toFixed(1)} meals / day)</span>
                </span>
                <div className="flex-1 min-w-0">
                    <Slider min={MIN_DAYS_BETWEEN} max={MAX_DAYS_BETWEEN} step={0.1} value={saved.daysBetween} onChange={daysBetween => onChange({ daysBetween })} />
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-700" title="Sets a protein floor per kg of body weight (needs your weight): modest exercise 1.0, moderately-heavy exercise 1.1, heavy exercise 1.2, athlete 1.6, extreme athlete 2.0 g/kg, from sports-nutrition position statements. General uses the standard's own value, which is for ordinary everyday life.">
                <span className="shrink-0 w-64">Activity level: {ACTIVITY_LEVELS[saved.activity].label}</span>
                <div className="flex-1 min-w-0">
                    <Slider min={0} max={ACTIVITY_LEVELS.length - 1} step={1} value={saved.activity} onChange={activity => onChange({ activity })} />
                </div>
            </div>
        </>
    );
}
