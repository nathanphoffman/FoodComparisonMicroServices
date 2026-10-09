import type { MicronutrientKey } from './FoodTableTypes';
import { MICRONUTRIENT_INFO } from './FoodTableCalculations';

export type Sex = 'male' | 'female';

/** What the diet row's tooltip needs to turn amounts into the user's own whole-diet % of need. */
// absorption is the share of each absorption-limited nutrient (B12, calcium, vitamin C) that still counts given how
// many meals a day each food is eaten in (1 = no loss); missing nutrients count fully.
export type DietSettings = {
    calories: number | null; sex: Sex | null; age: number | null; weightLb: number | null;
    absorption?: Partial<Record<MicronutrientKey, number>>;
};

/** Protein need in g/day: the 0.8 g per kg of body weight adult RDA. */
export const PROTEIN_G_PER_KG = 0.8;
const LB_PER_KG = 2.20462;
export const proteinNeedGrams = (weightLb: number | null) => weightLb ? (weightLb / LB_PER_KG) * PROTEIN_G_PER_KG : null;

export const MIN_RDA_AGE = 14;

// Which country's / agency's recommended intakes to use. 'average' is the plain mean of the five.
export type NutrientStandard = 'average' | 'us' | 'eu' | 'japan' | 'china' | 'who';
export const DEFAULT_NUTRIENT_STANDARD: NutrientStandard = 'average';
export const NUTRIENT_STANDARD_OPTIONS: { value: NutrientStandard; label: string }[] = [
    { value: 'average', label: 'Average of all five' },
    { value: 'us',      label: 'US (NIH RDA)' },
    { value: 'eu',      label: 'Europe (EFSA)' },
    { value: 'japan',   label: 'Japan (DRI 2020)' },
    { value: 'china',   label: 'China (DRI 2023)' },
    { value: 'who',     label: 'WHO / FAO' },
];
const STANDARDS: Exclude<NutrientStandard, 'average'>[] = ['us', 'eu', 'japan', 'china', 'who'];

// US NIH / National Academies Recommended Dietary Allowances (adequate intakes for vitamin K,
// potassium and ALA) for non-pregnant people 14 and over. Each entry is [male, female] by age band;
// a single number applies to both. EPA + DHA has no US value, so it keeps the FDA-style 250 mg.
type Bands = { upTo: number; value: number | [number, number] }[];
const US_RDA: Partial<Record<MicronutrientKey, Bands>> = {
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

// Adult [male, female] values for the other standards. APPROXIMATE: typed from memory (only some EFSA values were
// checked against a source), so verify against the official tables. Left out where a standard sets no value.
// They carry no age bands, so under 19 every standard falls back to the US table. Where a value depends on
// absorption we use a middle case (WHO iron at 15% absorption, WHO zinc moderate, EFSA zinc at 600 mg phytate).
type Pair = [number, number];
const ADULT: Record<Exclude<NutrientStandard, 'average' | 'us'>, Partial<Record<MicronutrientKey, Pair>>> = {
    eu: {
        vitamin_a: [750, 650], vitamin_c: [110, 95], vitamin_d: [15, 15], vitamin_e: [13, 11], vitamin_k: [70, 70],
        folate: [330, 330], vitamin_b12: [4, 4], vitamin_b6: [1.7, 1.6], calcium: [950, 950], iron: [11, 16],
        magnesium: [350, 300], potassium: [3500, 3500], zinc: [11.7, 9.3], phosphorus: [550, 550], selenium: [70, 70],
        ala: [1.1, 1.1], epa_dha: [250, 250],
    },
    japan: {
        vitamin_a: [850, 650], vitamin_c: [100, 100], vitamin_d: [8.5, 8.5], vitamin_e: [6, 5], vitamin_k: [150, 150],
        folate: [240, 240], vitamin_b12: [2.4, 2.4], vitamin_b6: [1.4, 1.1], calcium: [750, 650], iron: [7.5, 10.5],
        magnesium: [370, 290], potassium: [2500, 2000], zinc: [11, 8], phosphorus: [1000, 800], selenium: [30, 25],
    },
    china: {
        vitamin_a: [770, 660], vitamin_c: [100, 100], vitamin_d: [10, 10], vitamin_e: [14, 14], vitamin_k: [80, 80],
        folate: [400, 400], vitamin_b12: [2.4, 2.4], vitamin_b6: [1.4, 1.4], calcium: [800, 800], iron: [12, 18],
        magnesium: [330, 330], potassium: [3600, 3600], zinc: [12, 8.5], phosphorus: [720, 720], selenium: [60, 60],
    },
    who: {
        vitamin_a: [600, 500], vitamin_c: [45, 45], vitamin_d: [5, 5], vitamin_k: [65, 55], folate: [400, 400],
        vitamin_b12: [2.4, 2.4], vitamin_b6: [1.3, 1.3], calcium: [1000, 1000], iron: [9.1, 19.6], magnesium: [260, 220],
        potassium: [3510, 3510], zinc: [4.2, 3], selenium: [34, 26],
    },
};

const ADULT_AGE = 19;
const DEFAULT_AGE = 30;

/** One standard's need for a nutrient, or null if it sets none. Without a sex it's the mean of male and female. */
function standardNeed(standard: Exclude<NutrientStandard, 'average'>, key: MicronutrientKey, sex: Sex | null, age: number | null): number | null {
    let value: number | Pair | undefined;
    if (standard === 'us' || (age !== null && age < ADULT_AGE)) {
        const bands = US_RDA[key];
        value = bands ? bands.find(b => (age ?? DEFAULT_AGE) <= b.upTo)?.value : MICRONUTRIENT_INFO[key].dailyValue;
    } else {
        value = ADULT[standard][key];
    }
    if (value === undefined) return null;
    if (typeof value === 'number') return value;
    return sex === null ? (value[0] + value[1]) / 2 : value[sex === 'male' ? 0 : 1];
}

// Reference body weights (kg) the adult values are set for (US DRI reference adults); 70 when sex isn't set.
// Needs rise with body weight to the 0.75 power (metabolic scaling), so a 50% heavier person needs ~36% more.
const REFERENCE_KG = { male: 76, female: 61, unset: 70 };
const WEIGHT_EXPONENT = 0.75;

/** Short description of which needs are in use, for the tooltip title. */
export function needsLabel(standard: NutrientStandard, sex: Sex | null, age: number | null, weightLb: number | null): string {
    const name = NUTRIENT_STANDARD_OPTIONS.find(o => o.value === standard)?.label ?? '';
    return sex !== null || age !== null || weightLb !== null ? `${name}, adjusted for you` : name;
}

/** Daily need for each nutrient under a standard, for the sex and age given (averaged when unset), scaled for body weight. */
export function dailyNeeds(standard: NutrientStandard, sex: Sex | null, age: number | null, weightLb: number | null): Record<MicronutrientKey, number> {
    const weightScale = weightLb ? ((weightLb / LB_PER_KG) / REFERENCE_KG[sex ?? 'unset']) ** WEIGHT_EXPONENT : 1;
    const needs = {} as Record<MicronutrientKey, number>;
    for (const key of Object.keys(MICRONUTRIENT_INFO) as MicronutrientKey[]) {
        const values = (standard === 'average' ? STANDARDS : [standard])
            .map(s => standardNeed(s, key, sex, age))
            .filter((v): v is number => v !== null);
        const base = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : MICRONUTRIENT_INFO[key].dailyValue;
        needs[key] = base * weightScale;
    }
    return needs;
}
