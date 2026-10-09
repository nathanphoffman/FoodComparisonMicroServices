import type { ScoredRow } from './FoodTableSort';
import { formatIntelligenceValue } from './FoodTableCalculations';

// The diet's overall impact: each scored measure for the whole diet, judged against every other food in the table.
// Values are per Compare By unit, the same as the table columns, so they compare fairly with other foods.

// What a measure is worth in a real unit: for the whole day when your calories / day is known, otherwise per 1,000 kcal.
type Basis = { kg: number; perDay: boolean; rawLandM2PerKg: number | null };
type Amount = { value: number; unit: string };

type Metric = {
    label:         string;
    value:         (row: ScoredRow) => number | null | undefined;
    lowerIsBetter: boolean;
    amount?:       (row: ScoredRow, basis: Basis) => Amount | null;
};

const METRICS: Metric[] = [
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

// How the diet compares with the other foods: the share of them it beats. Average is the middle 10%, then each
// 10% further out is above/below average, then good/bad, and past that very good/very bad.
const TIERS = [
    { min: 75, name: 'Very good',     color: 'text-blue-600' },
    { min: 65, name: 'Good',          color: 'text-green-600' },
    { min: 55, name: 'Above average', color: 'text-lime-600' },
    { min: 45, name: 'Average',       color: 'text-yellow-600' },
    { min: 35, name: 'Below average', color: 'text-amber-600' },
    { min: 25, name: 'Bad',           color: 'text-orange-600' },
    { min: 0,  name: 'Very bad',      color: 'text-red-600' },
];

function formatValue(value: number, metric: Metric): string {
    // Sentient harm is shown with the table's M / G / T / P suffixes.
    if (metric.label === 'Sentient harm') return formatIntelligenceValue(value);
    return Math.abs(value) >= 100 ? Math.round(value).toLocaleString() : value.toPrecision(3);
}

export function DietImpact({ row, scored, foodSlugs, unit, dailyCalories, caloriesPerGram, rawLandM2PerKg }: {
    row: ScoredRow;
    scored: Map<string, ScoredRow>;
    foodSlugs: Set<string>;
    unit: string;
    dailyCalories: number | null;
    caloriesPerGram: number | null;
    /** Physical land (m² per kg) of the whole diet, from its foods. */
    rawLandM2PerKg: number | null;
}) {
    // kg of this diet eaten in a day, from your calorie total and the diet's calories per gram; without a
    // calorie total the amounts are per 1,000 kcal instead.
    const basis: Basis | null = !caloriesPerGram ? null : dailyCalories
        ? { kg: dailyCalories / (caloriesPerGram * 1000), perDay: true, rawLandM2PerKg }
        : { kg: 1 / caloriesPerGram, perDay: false, rawLandM2PerKg };
    const others = [...scored.values()].filter(food => foodSlugs.has(food.slug));

    return (
        <section className="mt-5 pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800">Overall impact</h3>
            <p className="mt-1 text-neutral-500">
                {basis?.perDay ? `Amounts are for your ${dailyCalories!.toLocaleString()} kcal day.` : 'Enter your total calories / day for whole-day amounts; these are per 1,000 kcal.'} The ranking against the {others.length} foods in the table uses the table's per-{unit} values.
            </p>
            <div className="mt-2 divide-y divide-neutral-100">
                {METRICS.map(metric => {
                    const value = metric.value(row);
                    if (value == null) return null;
                    const comparable = others.flatMap(food => {
                        const other = metric.value(food);
                        return other == null ? [] : [other];
                    });
                    const beaten = comparable.filter(other => metric.lowerIsBetter ? other > value : other < value).length;
                    const percent = comparable.length > 0 ? (beaten / comparable.length) * 100 : null;
                    const tier = percent === null ? null : TIERS.find(t => percent >= t.min)!;
                    const amount = basis && metric.amount ? metric.amount(row, basis) : null;
                    return (
                        <div key={metric.label} className="py-1.5 flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
                            <span className="w-28 shrink-0 font-medium text-neutral-800">{metric.label}</span>
                            <span className="w-52 shrink-0 text-neutral-700">
                                {amount ? `${formatValue(amount.value, metric)} ${amount.unit}` : formatValue(value, metric)}
                            </span>
                            <span className={`flex-1 ${tier?.color ?? 'text-neutral-500'}`}>
                                {tier && percent !== null
                                    ? <><strong>{tier.name}</strong> — better than {Math.round(percent)}% of foods</>
                                    : 'Nothing to compare with'}
                            </span>
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 text-neutral-500">
                Average is better than 45–55% of foods; above and below average are the next 10% either side, good and bad the next 10%, and very good (blue) and very bad (red) beyond that.
                The percentage is the share of foods the diet beats: CO₂e, land, water and sentient harm are better when lower; Improvement, nutrition and availability when higher.
            </p>
        </section>
    );
}
