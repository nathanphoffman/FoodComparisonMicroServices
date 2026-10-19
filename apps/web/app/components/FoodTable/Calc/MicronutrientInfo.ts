import type { MicronutrientKey } from '../FoodTableTypes';

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
