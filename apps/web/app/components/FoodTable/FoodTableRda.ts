import type { MicronutrientKey } from './FoodTableTypes';
import { MICRONUTRIENT_INFO } from './FoodTableCalculations';

export type Sex = 'male' | 'female';

/** What the diet row's tooltip needs to turn amounts into the user's own whole-diet % of need. */
export type DietSettings = { calories: number | null; sex: Sex | null; age: number | null; weightLb: number | null };

/** Protein need in g/day: the 0.8 g per kg of body weight adult RDA. */
export const PROTEIN_G_PER_KG = 0.8;
const LB_PER_KG = 2.20462;
export const proteinNeedGrams = (weightLb: number | null) => weightLb ? (weightLb / LB_PER_KG) * PROTEIN_G_PER_KG : null;

export const MIN_RDA_AGE = 14;

// US NIH / National Academies Recommended Dietary Allowances (adequate intakes for vitamin K,
// potassium and ALA) for non-pregnant people 14 and over. Each entry is [male, female] by age band;
// a single number applies to both. EPA + DHA has no US value, so it keeps the FDA-style 250 mg.
type Bands = { upTo: number; value: number | [number, number] }[];
const RDA: Partial<Record<MicronutrientKey, Bands>> = {
    vitamin_a:   [{ upTo: 150, value: [900, 700] }],
    vitamin_c:   [{ upTo: 18, value: [75, 65] }, { upTo: 150, value: [90, 75] }],
    vitamin_d:   [{ upTo: 70, value: 15 }, { upTo: 150, value: 20 }],
    vitamin_e:   [{ upTo: 150, value: 15 }],
    vitamin_k:   [{ upTo: 18, value: 75 }, { upTo: 150, value: [120, 90] }],
    folate:      [{ upTo: 150, value: 400 }],
    vitamin_b12: [{ upTo: 150, value: 2.4 }],
    vitamin_b6:  [{ upTo: 18, value: [1.3, 1.2] }, { upTo: 50, value: 1.3 }, { upTo: 150, value: [1.7, 1.5] }],
    calcium:     [{ upTo: 18, value: 1300 }, { upTo: 50, value: 1000 }, { upTo: 70, value: [1000, 1200] }, { upTo: 150, value: 1200 }],
    iron:        [{ upTo: 18, value: [11, 15] }, { upTo: 50, value: [8, 18] }, { upTo: 150, value: 8 }],
    magnesium:   [{ upTo: 18, value: [410, 360] }, { upTo: 30, value: [400, 310] }, { upTo: 150, value: [420, 320] }],
    potassium:   [{ upTo: 18, value: [3000, 2300] }, { upTo: 150, value: [3400, 2600] }],
    zinc:        [{ upTo: 18, value: [11, 9] }, { upTo: 150, value: [11, 8] }],
    phosphorus:  [{ upTo: 18, value: 1250 }, { upTo: 150, value: 700 }],
    selenium:    [{ upTo: 150, value: 55 }],
    ala:         [{ upTo: 150, value: [1.6, 1.1] }],
};

// Reference body weights (kg) the adult values are set for (US DRI reference adults); 70 when sex isn't set.
// Needs rise with body weight to the 0.75 power (metabolic scaling), so a 50% heavier person needs ~36% more.
const REFERENCE_KG = { male: 76, female: 61, unset: 70 };
const WEIGHT_EXPONENT = 0.75;

const hasSexAndAge = (sex: Sex | null, age: number | null) => sex !== null && age !== null && age >= MIN_RDA_AGE;

/** True when the needs are personalised (sex and age and/or weight) rather than the plain FDA values. */
export const hasPersonalNeeds = (sex: Sex | null, age: number | null, weightLb: number | null) =>
    hasSexAndAge(sex, age) || weightLb !== null;

/** Daily need for each nutrient: the sex and age value (FDA value if either is missing), scaled for body weight. */
export function dailyNeeds(sex: Sex | null, age: number | null, weightLb: number | null): Record<MicronutrientKey, number> {
    const byAge = hasSexAndAge(sex, age);
    const weightScale = weightLb ? ((weightLb / LB_PER_KG) / REFERENCE_KG[sex ?? 'unset']) ** WEIGHT_EXPONENT : 1;
    const needs = {} as Record<MicronutrientKey, number>;
    for (const key of Object.keys(MICRONUTRIENT_INFO) as MicronutrientKey[]) {
        const band = byAge ? RDA[key]?.find(b => age! <= b.upTo) : undefined;
        const base = !band ? MICRONUTRIENT_INFO[key].dailyValue
            : typeof band.value === 'number' ? band.value
            : band.value[sex === 'male' ? 0 : 1];
        needs[key] = base * weightScale;
    }
    return needs;
}
