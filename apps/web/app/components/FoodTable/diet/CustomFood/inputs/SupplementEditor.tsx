import { Slider } from '../../../../Inputs/Slider';
import { SliderRow } from '../../../../Inputs/SliderRow';
import { MICRONUTRIENT_INFO } from '../../../nutrition/FoodTableCalculations';
import { MICRONUTRIENT_KEYS, type MicronutrientKey } from '../../../types/FoodTableTypes';
import { dailyNeeds, type NutrientStandard } from '../../../nutrition/FoodTableRda';
import { MultivitaminForm } from './MultivitaminForm';
import { SupplementRow } from './SupplementRow';
import { DEFAULT_PILLS_PER_WEEK, type Saved, type Supplement } from '../logic/CustomFoodSaved';

const PILL_ABSORPTION_STEP = 5;
const PILL_ABSORPTION_HELP = "The share of each pill's dose your body absorbs. Applied to every supplement, on top of the per-sitting limit for B12, calcium and vitamin C.";

type Props = {
    saved: Saved;
    /** Whose recommended intakes a supplement's % RDA is measured against. */
    standard: NutrientStandard;
    onChange: (patch: Partial<Saved>) => void;
};

/** Adds, edits and removes the vitamins and minerals taken as pills, and sets how much of each pill is absorbed. */
export function SupplementEditor({ saved, standard, onChange }: Props) {
    const needs = dailyNeeds(standard, saved.sex, saved.age, saved.weightLb);
    const setSupplements = (supplements: Supplement[]) => onChange({ supplements });

    function addOne(key: MicronutrientKey) {
        setSupplements([...saved.supplements, { key, dose: MICRONUTRIENT_INFO[key].dailyValue, perWeek: DEFAULT_PILLS_PER_WEEK }]);
    }

    return (
        <div className="flex flex-col gap-1.5 text-sm text-neutral-700">
            <div className="flex flex-wrap items-center gap-2">
                <span>Vitamins & supplements</span>
                <select
                    value=""
                    onChange={e => { if (e.target.value) addOne(e.target.value as MicronutrientKey); }}
                    aria-label="Add a vitamin or mineral"
                    className="border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white"
                >
                    <option value="">Add a vitamin…</option>
                    {MICRONUTRIENT_KEYS.map(key => (
                        <option key={key} value={key}>{MICRONUTRIENT_INFO[key].label}</option>
                    ))}
                </select>
            </div>
            <MultivitaminForm dailyNeeds={needs} onAdd={added => setSupplements([...saved.supplements, ...added])} />
            <SliderRow label={`Pill absorption: ${saved.pillAbsorption}%`} title={PILL_ABSORPTION_HELP}>
                <Slider min={0} max={100} step={PILL_ABSORPTION_STEP} value={saved.pillAbsorption} onChange={pillAbsorption => onChange({ pillAbsorption })} />
            </SliderRow>
            {saved.supplements.map((supplement, i) => (
                <SupplementRow
                    key={i}
                    supplement={supplement}
                    dailyNeed={needs[supplement.key]}
                    onChange={patch => setSupplements(saved.supplements.map((s, j) => j === i ? { ...s, ...patch } : s))}
                    onRemove={() => setSupplements(saved.supplements.filter((_, j) => j !== i))}
                />
            ))}
        </div>
    );
}
