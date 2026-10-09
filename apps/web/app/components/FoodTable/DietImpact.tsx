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
    { min: 75, score: 3, name: 'Very good',     color: 'text-blue-600' },
    { min: 65, score: 2, name: 'Good',          color: 'text-green-600' },
    { min: 55, score: 1, name: 'Above average', color: 'text-lime-600' },
    { min: 45, score: 0, name: 'Average',       color: 'text-yellow-600' },
    { min: 35, score: -1, name: 'Below average', color: 'text-amber-600' },
    { min: 25, score: -2, name: 'Bad',           color: 'text-orange-600' },
    { min: 0,  score: -3, name: 'Very bad',      color: 'text-red-600' },
];

// The second verdict: how far the diet is from the average American diet (built from this dataset's own foods and
// scored the same way), not its rank among single foods. Within 10% of the benchmark is average; each further 15%,
// 25%, then beyond 50% steps through above/below average, good/bad and very good/very bad.
const DISTANCE_TIERS = [
    { min: 0.5,   score: 3, name: 'Very good',     color: 'text-blue-600' },
    { min: 0.25,  score: 2, name: 'Good',          color: 'text-green-600' },
    { min: 0.1,   score: 1, name: 'Above average', color: 'text-lime-600' },
    { min: -0.1,  score: 0, name: 'Average',       color: 'text-yellow-600' },
    { min: -0.25, score: -1, name: 'Below average', color: 'text-amber-600' },
    { min: -0.5,  score: -2, name: 'Bad',           color: 'text-orange-600' },
    { min: -Infinity, score: -3, name: 'Very bad',  color: 'text-red-600' },
];

// The net verdict: each column's tier is worth -3 (very bad) to +3 (very good); the overall is their average, rounded
// to the nearest tier. If only one column has a verdict, that one stands alone.
const OVERALL_TIERS = [...TIERS];
function overallTier(scores: number[]) {
    if (scores.length === 0) return null;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    // Halves round away from zero, so +1.5 and -1.5 land the same distance from average.
    const rounded = Math.sign(average) * Math.round(Math.abs(average));
    return OVERALL_TIERS.find(tier => tier.score === rounded)!;
}

// 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st.
function ordinal(n: number): string {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
    return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

function formatValue(value: number, metric: Metric): string {
    // Sentient harm is shown with the table's M / G / T / P suffixes.
    if (metric.label === 'Sentient harm') return formatIntelligenceValue(value);
    return Math.abs(value) >= 100 ? Math.round(value).toLocaleString() : value.toPrecision(3);
}

export function DietImpact({ row, scored, foodSlugs, unit, dailyCalories, caloriesPerGram, rawLandM2PerKg, benchmark, benchmarkRawLandM2PerKg }: {
    row: ScoredRow;
    scored: Map<string, ScoredRow>;
    foodSlugs: Set<string>;
    unit: string;
    dailyCalories: number | null;
    caloriesPerGram: number | null;
    /** Physical land (m² per kg) of the whole diet, from its foods. */
    rawLandM2PerKg: number | null;
    /** The average American diet, scored the same way as the user's. */
    benchmark: ScoredRow | null;
    benchmarkRawLandM2PerKg: number | null;
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
            <div className="hidden md:flex gap-4 mt-2 pb-1 text-neutral-400 font-medium border-b border-neutral-200">
                <span className="w-28 shrink-0" />
                <span className="w-52 shrink-0">Your diet</span>
                <span className="flex-1">Percentile among foods</span>
                <span className="flex-1">Vs. average food</span>
                <span className="flex-1">Vs. average American diet</span>
                <span className="w-28 shrink-0">Overall</span>
            </div>
            <div className="divide-y divide-neutral-100">
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
                    // How much better (positive) or worse (negative) than the average food, as a share of that average.
                    const mean = comparable.length > 0 ? comparable.reduce((sum, other) => sum + other, 0) / comparable.length : null;
                    const betterThanMean = mean !== null && mean !== 0 ? (metric.lowerIsBetter ? mean - value : value - mean) / Math.abs(mean) : null;
                    const meanTier = betterThanMean === null ? null : DISTANCE_TIERS.find(t => betterThanMean >= t.min)!;
                    // How much better (positive) or worse (negative) than the average American diet, as a share of it.
                    const reference = benchmark ? metric.value(benchmark) : null;
                    const better = reference != null && reference !== 0 ? (metric.lowerIsBetter ? reference - value : value - reference) / Math.abs(reference) : null;
                    const distanceTier = better === null ? null : DISTANCE_TIERS.find(t => better >= t.min)!;
                    // What the benchmark amounts to on the same basis as your amount (a day at your calories, or per 1,000 kcal).
                    const referenceAmount = benchmark && basis && metric.amount ? metric.amount(benchmark, { ...basis, rawLandM2PerKg: benchmarkRawLandM2PerKg }) : null;
                    const overall = overallTier([tier, meanTier, distanceTier].flatMap(t => t ? [t.score] : []));
                    return (
                        <div key={metric.label} className="py-1.5 flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
                            <span className="w-28 shrink-0 font-medium text-neutral-800">{metric.label}</span>
                            <span className="w-52 shrink-0 text-neutral-700">
                                {amount ? `${formatValue(amount.value, metric)} ${amount.unit}` : formatValue(value, metric)}
                            </span>
                            <span className={`flex-1 ${tier?.color ?? 'text-neutral-500'}`}>
                                {tier && percent !== null
                                    ? <><strong>{tier.name}</strong> — {ordinal(Math.round(percent))} percentile</>
                                    : 'No comparison'}
                            </span>
                            <span className={`flex-1 ${meanTier?.color ?? 'text-neutral-500'}`}>
                                {meanTier && betterThanMean !== null
                                    ? <><strong>{meanTier.name}</strong> — {Math.min(Math.round(Math.abs(betterThanMean) * 100), 999)}% {betterThanMean >= 0 ? 'better' : 'worse'}</>
                                    : 'No average'}
                            </span>
                            <span className={`flex-1 ${distanceTier?.color ?? 'text-neutral-500'}`}>
                                {distanceTier && better !== null
                                    ? <><strong>{distanceTier.name}</strong> — {Math.min(Math.round(Math.abs(better) * 100), 999)}% {better >= 0 ? 'better' : 'worse'}{referenceAmount && ` (${formatValue(referenceAmount.value, metric)} ${referenceAmount.unit})`}</>
                                    : 'No benchmark'}
                            </span>
                            <span className={`w-28 shrink-0 font-semibold ${overall?.color ?? 'text-neutral-500'}`}>{overall?.name ?? '—'}</span>
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 text-neutral-500">
                Percentile is the share of foods in the table the diet beats (90th percentile: better than 90% of foods); average is the 45th to 55th, above and below average the next 10% either side, good and bad the next 10%, and very good (blue) and very bad (red) beyond that.
                The two "vs." columns measure how far the diet is from an average: within 10% is average, 10–25% above or below, 25–50% good or bad, beyond 50% very good or very bad. "Average food" is the mean across all foods in the table; "average American diet" is a diet built from this dataset's own foods using USDA calorie shares by food group (about 2,500 kcal a day, some shares approximate), shown on your calories.
                Overall averages the three verdicts (very bad is -3 up to very good +3) and rounds to the nearest tier. CO₂e, land, water and sentient harm are better when lower; Improvement, nutrition and availability when higher.
            </p>
        </section>
    );
}
