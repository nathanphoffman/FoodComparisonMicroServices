import type { ScoredRow } from '../scoring/FoodTableSort';
import type { Basis } from './Impact/DietImpactMetrics';
import { METRICS } from './Impact/DietImpactMetrics';
import { DietImpactRow } from './Impact/DietImpactRow';

// The diet's overall impact: each scored measure for the whole diet, judged against every other food in the table.

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
                {METRICS.map(metric => (
                    <DietImpactRow key={metric.label} metric={metric} row={row} others={others} basis={basis} benchmark={benchmark} benchmarkRawLandM2PerKg={benchmarkRawLandM2PerKg} />
                ))}
            </div>
            <p className="mt-2 text-neutral-500">
                Percentile is the share of foods in the table the diet beats (90th percentile: better than 90% of foods); average is the 45th to 55th, above and below average the next 10% either side, good and bad the next 10%, and very good (blue) and very bad (red) beyond that.
                The two "vs." columns measure how far the diet is from an average: within 10% is average, 10–25% above or below, 25–50% good or bad, beyond 50% very good or very bad. "Average food" is the mean across all foods in the table; "average American diet" is a diet built from this dataset's own foods using USDA calorie shares by food group (about 2,500 kcal a day, some shares approximate), shown on your calories.
                Overall averages the three verdicts (very bad is -3 up to very good +3) and rounds to the nearest tier. CO₂e, land, water and sentient harm are better when lower; Improvement, nutrition and availability when higher.
            </p>
        </section>
    );
}
