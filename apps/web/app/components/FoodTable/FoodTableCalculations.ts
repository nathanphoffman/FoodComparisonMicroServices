import type { RawFood, CustomFoodInput, Micronutrients, AminoAcids } from './FoodTableTypes';
import { MICRONUTRIENT_KEYS, AMINO_ACID_KEYS } from './FoodTableTypes';
import type { AminoAcidKey, FoodWeights, IntelligenceDetail, MicronutrientKey, NutritionDetail } from './FoodTableTypes';

// ── Display-only constants ────────────────────────────────────────────────────

export const ONE_MILLION    = 1_000_000;
export const ONE_BILLION    = 1_000_000_000;
export const ONE_TRILLION   = 1e12;
const        ONE_THOUSAND   = 1_000;
const        ONE_QUADRILLION = 1e15;

// Daily values are display copies of DAILY_VALUES in services/wasm-calculations
// micronutrients.rs (FDA Daily Values; omega-3 from NIH / EFSA) — keep in sync.
// credit 2 = counts double in the nutrition score (DOUBLE_CREDIT in micronutrients.rs).
export const MICRONUTRIENT_INFO: Record<MicronutrientKey, { label: string; unit: 'g' | 'mg' | 'µg'; dailyValue: number; credit: 1 | 2 }> = {
    vitamin_a:   { label: 'Vitamin A',  unit: 'µg', dailyValue: 900, credit: 1 },
    vitamin_c:   { label: 'Vitamin C',  unit: 'mg', dailyValue: 90, credit: 1 },
    vitamin_d:   { label: 'Vitamin D',  unit: 'µg', dailyValue: 20, credit: 2 },
    vitamin_e:   { label: 'Vitamin E',  unit: 'mg', dailyValue: 15, credit: 1 },
    vitamin_k:   { label: 'Vitamin K',  unit: 'µg', dailyValue: 120, credit: 1 },
    folate:      { label: 'Folate',     unit: 'µg', dailyValue: 400, credit: 1 },
    vitamin_b12: { label: 'B12',        unit: 'µg', dailyValue: 2.4, credit: 1 },
    vitamin_b6:  { label: 'B6',         unit: 'mg', dailyValue: 1.7, credit: 1 },
    calcium:     { label: 'Calcium',    unit: 'mg', dailyValue: 1300, credit: 2 },
    iron:        { label: 'Iron',       unit: 'mg', dailyValue: 18, credit: 1 },
    magnesium:   { label: 'Magnesium',  unit: 'mg', dailyValue: 420, credit: 1 },
    potassium:   { label: 'Potassium',  unit: 'mg', dailyValue: 4700, credit: 2 },
    zinc:        { label: 'Zinc',       unit: 'mg', dailyValue: 11, credit: 1 },
    phosphorus:  { label: 'Phosphorus', unit: 'mg', dailyValue: 1250, credit: 1 },
    selenium:    { label: 'Selenium',   unit: 'µg', dailyValue: 55, credit: 1 },
    ala:         { label: 'Omega-3 ALA',     unit: 'g',  dailyValue: 1.6, credit: 1 },
    epa_dha:     { label: 'Omega-3 EPA+DHA', unit: 'mg', dailyValue: 250, credit: 2 },
};

// What the body needs per gram of protein: the FAO (2013) indispensable amino acid reference pattern
// for older children, adolescents and adults, in mg per g of protein. Display copy of the constants in
// services/wasm-calculations amino_acids.rs — keep in sync. `group` ties methionine + cystine and
// phenylalanine + tyrosine together, as FAO scores them.
export type AminoAcidInfo = { label: string; essential: boolean; group?: 'saa' | 'aaa' };
export const AMINO_ACID_INFO: Record<AminoAcidKey, AminoAcidInfo> = {
    histidine:     { label: 'Histidine',     essential: true },
    isoleucine:    { label: 'Isoleucine',    essential: true },
    leucine:       { label: 'Leucine',       essential: true },
    lysine:        { label: 'Lysine',        essential: true },
    methionine:    { label: 'Methionine',    essential: true, group: 'saa' },
    cystine:       { label: 'Cystine',       essential: true, group: 'saa' },
    phenylalanine: { label: 'Phenylalanine', essential: true, group: 'aaa' },
    tyrosine:      { label: 'Tyrosine',      essential: true, group: 'aaa' },
    threonine:     { label: 'Threonine',     essential: true },
    tryptophan:    { label: 'Tryptophan',    essential: true },
    valine:        { label: 'Valine',        essential: true },
    alanine:       { label: 'Alanine',       essential: false },
    arginine:      { label: 'Arginine',      essential: false },
    aspartic_acid: { label: 'Aspartic acid', essential: false },
    glutamic_acid: { label: 'Glutamic acid', essential: false },
    glycine:       { label: 'Glycine',       essential: false },
    proline:       { label: 'Proline',       essential: false },
    serine:        { label: 'Serine',        essential: false },
};

// The nine scored requirements, mg per g of protein. `keys` are summed before comparing.
export const AMINO_ACID_REQUIREMENTS: { label: string; keys: AminoAcidKey[]; mgPerGramProtein: number }[] = [
    { label: 'Histidine',                      keys: ['histidine'],                   mgPerGramProtein: 16 },
    { label: 'Isoleucine',                     keys: ['isoleucine'],                  mgPerGramProtein: 30 },
    { label: 'Leucine',                        keys: ['leucine'],                     mgPerGramProtein: 61 },
    { label: 'Lysine',                         keys: ['lysine'],                      mgPerGramProtein: 48 },
    { label: 'Methionine + cystine',           keys: ['methionine', 'cystine'],       mgPerGramProtein: 23 },
    { label: 'Phenylalanine + tyrosine',       keys: ['phenylalanine', 'tyrosine'],   mgPerGramProtein: 41 },
    { label: 'Threonine',                      keys: ['threonine'],                   mgPerGramProtein: 25 },
    { label: 'Tryptophan',                     keys: ['tryptophan'],                  mgPerGramProtein: 6.6 },
    { label: 'Valine',                         keys: ['valine'],                      mgPerGramProtein: 40 },
];

export type AminoAcidProfile = {
    /** The nine scored requirements: mg per g of this food's protein vs what the body needs. */
    requirements: { label: string; mgPerGramProtein: number; needed: number; share: number }[];
    /** The other amino acids (not scored): mg per g of protein. */
    others: { label: string; mgPerGramProtein: number }[];
    /** Amino acid score: the weakest requirement's share, capped at 1; null if any essential amino acid is unreported. */
    score: number | null;
    /** Label of the weakest requirement (the "limiting" amino acid); null when there is no score. */
    limiting: string | null;
};

/** Per-protein amino acid profile for a food or meal's nutrition detail; null when it has no amino acid data. */
export function aminoAcidProfile(detail: Pick<NutritionDetail, 'protein' | 'aminoAcids'>): AminoAcidProfile | null {
    const { protein, aminoAcids } = detail;
    if (!aminoAcids || protein <= 0) return null;
    const perProtein = (key: AminoAcidKey): number | null => aminoAcids[key] == null ? null : aminoAcids[key]! * 1000 / protein;
    const requirements = AMINO_ACID_REQUIREMENTS.flatMap(({ label, keys, mgPerGramProtein: needed }) => {
        const parts = keys.map(perProtein);
        if (parts.some(part => part == null)) return [];
        const mgPerGramProtein = parts.reduce<number>((sum, part) => sum + part!, 0);
        return [{ label, mgPerGramProtein, needed, share: mgPerGramProtein / needed }];
    });
    const others = AMINO_ACID_KEYS.filter(key => !AMINO_ACID_INFO[key].essential && aminoAcids[key] != null)
        .map(key => ({ label: AMINO_ACID_INFO[key].label, mgPerGramProtein: perProtein(key)! }));
    const complete = requirements.length === AMINO_ACID_REQUIREMENTS.length;
    const weakest = complete ? requirements.reduce((low, row) => (row.share < low.share ? row : low)) : null;
    if (requirements.length === 0 && others.length === 0) return null;
    return { requirements, others, score: weakest ? Math.min(1, weakest.share) : null, limiting: weakest ? weakest.label : null };
}

// ── Formatters (no math, display only) ───────────────────────────────────────

export function formatNeurons(neuronCount: number): string {
    if (neuronCount >= ONE_BILLION)  return `${(neuronCount / ONE_BILLION).toFixed(0)}B`;
    if (neuronCount >= ONE_MILLION)  return `${(neuronCount / ONE_MILLION).toFixed(0)}M`;
    if (neuronCount >= ONE_THOUSAND) return `${(neuronCount / ONE_THOUSAND).toFixed(0)}K`;
    return String(neuronCount);
}

export function formatIntelligenceValue(value: number): string {
    if (value >= ONE_QUADRILLION) return `${(value / ONE_QUADRILLION).toFixed(1)}P`;
    if (value >= ONE_TRILLION)    return `${(value / ONE_TRILLION).toFixed(1)}T`;
    if (value >= ONE_BILLION)     return `${(value / ONE_BILLION).toFixed(1)}G`;
    if (value >= ONE_MILLION)     return `${(value / ONE_MILLION).toFixed(1)}M`;
    return value.toFixed(0);
}

const DAYS_PER_YEAR   = 365;
const MONTHS_PER_YEAR = 12;

export function formatYears(years: number): string {
    if (years <= 0) return 'none';
    if (years < 1 / MONTHS_PER_YEAR) {
        const days = Math.max(1, Math.round(years * DAYS_PER_YEAR));
        return `${days} day${days === 1 ? '' : 's'}`;
    }
    if (years < 1) {
        const months = Math.round(years * MONTHS_PER_YEAR);
        return `${months} month${months === 1 ? '' : 's'}`;
    }
    return `${Number(years.toFixed(1))} year${years === 1 ? '' : 's'}`;
}

export function formatCount(count: number): string {
    return Number(count.toFixed(1)).toLocaleString();
}

export function nutritionScale(calories: number): number {
    return calories > 0 ? 100 / calories : 0;
}

export function getUnitLabel(weights: FoodWeights): string {
    if (weights.calories === 100) return '1000 kcal';
    if (weights.protein  === 100) return '100g protein';
    if (weights.dryMass  === 100) return 'kg dry matter';
    if (weights.wetMass  === 100) return 'kg as eaten';
    return 'weighted unit';
}

// ── RawFood field-mapping helpers (no computation) ───────────────────────────
// These exist so FoodTable.tsx doesn't need to inline field assignments for
// tooltip detail types that are pure passthroughs from the raw data.

export function toNutritionDetail(food: RawFood): NutritionDetail {
    return {
        calories:     food.calories,
        fat:          food.fat,
        saturatedFat: food.sat_fat,
        transFat:     food.trans_fat,
        cholesterol:  food.cholesterol,
        sodium:       food.sodium,
        carbs:        food.carbs,
        fiber:        food.fiber,
        sugar:        food.sugar,
        protein:      food.protein,
        micronutrients: food.micronutrients,
        aminoAcids:   food.amino_acids,
    };
}

/**
 * Combined nutrition (per gram) of a custom meal / diet: each ingredient's per-gram
 * values weighted by its share of the mass. A calorie share is turned into mass by
 * dividing by the food's calories per gram (same as the WASM blend).
 * Optional nutrients are shown if any ingredient has them; missing ones count as 0.
 */
export function blendNutritionDetail(custom: CustomFoodInput, foods: RawFood[]): NutritionDetail | null {
    const parts = custom.ingredients.flatMap(({ slug, fraction }) => {
        const food = foods.find(f => f.slug === slug);
        if (!food || fraction <= 0) return [];
        const mass = custom.basis === 'mass' ? fraction : food.calories > 0 ? fraction / food.calories : 0;
        return mass > 0 ? [{ food, mass }] : [];
    });
    const totalMass = parts.reduce((sum, part) => sum + part.mass, 0);
    if (totalMass <= 0) return null;

    const blend = (value: (food: RawFood) => number | null | undefined): number | null => {
        if (parts.every(part => value(part.food) == null)) return null;
        return parts.reduce((sum, part) => sum + (part.mass / totalMass) * (value(part.food) ?? 0), 0);
    };
    const micronutrients: Micronutrients = {};
    for (const key of MICRONUTRIENT_KEYS) {
        const amount = blend(food => food.micronutrients?.[key]);
        if (amount != null) micronutrients[key] = amount;
    }

    const aminoAcids: AminoAcids = {};
    for (const key of AMINO_ACID_KEYS) {
        const amount = blend(food => food.amino_acids?.[key]);
        if (amount != null) aminoAcids[key] = amount;
    }

    return {
        calories:     blend(food => food.calories) ?? 0,
        fat:          blend(food => food.fat) ?? 0,
        saturatedFat: blend(food => food.sat_fat) ?? 0,
        transFat:     blend(food => food.trans_fat),
        cholesterol:  blend(food => food.cholesterol),
        sodium:       blend(food => food.sodium),
        carbs:        blend(food => food.carbs),
        fiber:        blend(food => food.fiber) ?? 0,
        sugar:        blend(food => food.sugar),
        protein:      blend(food => food.protein) ?? 0,
        micronutrients: Object.keys(micronutrients).length > 0 ? micronutrients : null,
        aminoAcids:     Object.keys(aminoAcids).length > 0 ? aminoAcids : null,
    };
}

export function toIntelligenceDetail(food: RawFood): IntelligenceDetail {
    return {
        neuronCount:   food.neuron_count ?? 0,
        weightKg:      food.weight_kg,
        yieldFraction: food.yield_fraction,
    };
}

/**
 * Physical land (m² per kg) of a custom diet: each ingredient's land weighted by its share of the diet's mass.
 * The scorer leaves a custom food's own land detail empty, so it is rebuilt here from the ingredients.
 * Calorie shares become mass by dividing by calories per gram, as in the scorer; null when nothing matches.
 */
export function blendLandM2PerKg(
    custom: CustomFoodInput, foods: RawFood[], rawM2PerKg: (slug: string) => number | null | undefined,
): number | null {
    const parts = custom.ingredients.flatMap(({ slug, fraction }) => {
        const food = foods.find(f => f.slug === slug);
        if (!food || fraction <= 0) return [];
        const mass = custom.basis === 'mass' ? fraction : food.calories > 0 ? fraction / food.calories : 0;
        const land = rawM2PerKg(slug);
        return mass > 0 && land != null ? [{ mass, land }] : [];
    });
    const totalMass = parts.reduce((sum, part) => sum + part.mass, 0);
    return totalMass > 0 ? parts.reduce((sum, part) => sum + (part.mass / totalMass) * part.land, 0) : null;
}
