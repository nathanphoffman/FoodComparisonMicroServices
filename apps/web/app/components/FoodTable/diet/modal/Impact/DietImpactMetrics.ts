import type { ScoredRow } from '../../../scoring/FoodTableSort';

// Values are per Compare By unit, the same as the table columns, so they compare fairly with other foods.

// What a measure is worth in a real unit: for the whole day when your calories / day is known, otherwise per 1,000 kcal.
export type Basis = { kg: number; perDay: boolean; rawLandM2PerKg: number | null };
export type Amount = { value: number; unit: string };

export type Metric = {
    label:         string;
    value:         (row: ScoredRow) => number | null | undefined;
    lowerIsBetter: boolean;
    amount?:       (row: ScoredRow, basis: Basis) => Amount | null;
};

export const METRICS: Metric[] = [
    { label: 'Improvement', value: row => row.final_score, lowerIsBetter: false },
    { label: 'Nutrition score', value: row => row.nutrition_score, lowerIsBetter: false },
    {
        label: 'CO₂e', value: row => row.emissions, lowerIsBetter: true,
        amount: (row, { kg, perDay }) => ({ value: row.emissions! * row.divisor * kg, unit: perDay ? 'kg CO₂e / day' : 'kg CO₂e / 1,000 kcal' }),
    },
    {
        // Land is the area farmed to feed you; per kg it is m² for a year, so a day of food holds 365× a day's share.
        label: 'Land use', value: row => row.land_use, lowerIsBetter: true,
        amount: (_row, { kg, perDay, rawLandM2PerKg }) => rawLandM2PerKg === null ? null
            : { value: rawLandM2PerKg * kg * (perDay ? 365 : 1), unit: perDay ? 'm² of land / year' : 'm² / 1,000 kcal' },
    },
    {
        label: 'Water', value: row => row.water, lowerIsBetter: true,
        amount: (row, { kg, perDay }) => ({ value: row.water! * row.divisor * kg, unit: perDay ? 'L / day' : 'L / 1,000 kcal' }),
    },
    {
        label: 'Sentient harm', value: row => row.sentient_harm, lowerIsBetter: true,
        amount: (row, { kg, perDay }) => ({ value: row.sentient_harm! * row.divisor * kg, unit: perDay ? 'harm points / day' : 'harm points / 1,000 kcal' }),
    },
    { label: 'Availability', value: row => row.availability, lowerIsBetter: false },
];
