import { Slider } from '../../../../Inputs/Slider';
import { NumberField } from '../../../../Inputs/NumberField';
import { SelectField } from '../../../../Inputs/SelectField';
import { SliderRow } from '../../../../Inputs/SliderRow';
import { MAX_DAYS_BETWEEN, MIN_DAYS_BETWEEN, mealsPerDayFor } from '../../../nutrition/FoodTableAbsorption';
import { ACTIVITY_LEVELS } from '../../../nutrition/FoodTableTargets';
import { MIN_RDA_AGE } from '../../../nutrition/FoodTableRda';
import { positiveOrNull, type Saved } from '../logic/CustomFoodSaved';

const MAX_AGE = 120;
const SEX_OPTIONS = [
    { value: '', label: 'Not set' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
] as const;

const DAYS_BETWEEN_HELP = "The longest you go without eating a food on this list. The longer the gap, the more of its B12, calcium and vitamin C arrives in one meal, beyond what your body can absorb at once, which lowers the whole-diet % daily need. 0.1 days is 10 meals a day.";
const ACTIVITY_HELP = "Sets a protein floor per kg of body weight (needs your weight): modest exercise 1.0, moderately-heavy exercise 1.1, heavy exercise 1.2, athlete 1.6, extreme athlete 2.0 g/kg, from sports-nutrition position statements. General uses the standard's own value, which is for ordinary everyday life.";

type Props = { saved: Saved; onChange: (patch: Partial<Saved>) => void };

/** The person's daily calories, sex, age and weight, plus the two sliders that shape the whole-diet numbers. */
export function DietSettingsFields({ saved, onChange }: Props) {
    return (
        <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
                <NumberField label="Total calories / day" value={saved.calorieTarget} widthClassName="w-24" min={0} step={50} placeholder="2000"
                    onChange={text => onChange({ calorieTarget: positiveOrNull(text) })} />
                <SelectField label="Sex" value={saved.sex ?? ''} options={[...SEX_OPTIONS]}
                    onChange={sex => onChange({ sex: sex || null })} />
                <NumberField label="Age" value={saved.age} widthClassName="w-16" min={MIN_RDA_AGE} max={MAX_AGE}
                    title={`Adjusts your daily needs by age (${MIN_RDA_AGE} or older)`}
                    onChange={text => { const age = positiveOrNull(text); onChange({ age: age && Math.round(age) }); }} />
                <NumberField label="Weight (lb)" value={saved.weightLb} widthClassName="w-20" min={0}
                    title="Scales your vitamin and mineral needs (about weight^0.75) and sets your protein need (0.8 g per kg)"
                    onChange={text => onChange({ weightLb: positiveOrNull(text) })} />
            </div>
            <SliderRow title={DAYS_BETWEEN_HELP} label={<>
                Longest gap without eating a food on this list: {saved.daysBetween.toFixed(1)} {saved.daysBetween === 1 ? 'day' : 'days'}
                <span className="text-xs text-neutral-500"> (≈{mealsPerDayFor(saved.daysBetween).toFixed(1)} meals / day)</span>
            </>}>
                <Slider min={MIN_DAYS_BETWEEN} max={MAX_DAYS_BETWEEN} step={0.1} value={saved.daysBetween} onChange={daysBetween => onChange({ daysBetween })} />
            </SliderRow>
            <SliderRow title={ACTIVITY_HELP} label={`Activity level: ${ACTIVITY_LEVELS[saved.activity].label}`}>
                <Slider min={0} max={ACTIVITY_LEVELS.length - 1} step={1} value={saved.activity} onChange={activity => onChange({ activity })} />
            </SliderRow>
        </>
    );
}
