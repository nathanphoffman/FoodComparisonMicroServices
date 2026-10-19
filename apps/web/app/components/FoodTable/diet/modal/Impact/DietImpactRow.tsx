import type { ScoredRow } from '../../../types/FoodTableTypes';
import type { Basis, Metric } from './DietImpactMetrics';
import { describeBetterBy, judgeMetric } from './DietImpactVerdict';
import { formatValue, ordinal, squareFeet } from './DietImpactFormat';

type Props = {
    metric: Metric;
    row: ScoredRow;
    /** The other foods' scored rows, which the diet is ranked against. */
    others: ScoredRow[];
    basis: Basis | null;
    benchmark: ScoredRow | null;
    benchmarkRawLandM2PerKg: number | null;
};

/** One measure of the diet: its amount, its percentile among foods, how far it is from the average food and from the average American diet, and the overall verdict. */
export function DietImpactRow({ metric, row, others, basis, benchmark, benchmarkRawLandM2PerKg }: Props) {
    const value = metric.value(row);
    if (value == null) return null;
    const comparable = others.flatMap(food => {
        const other = metric.value(food);
        return other == null ? [] : [other];
    });
    const verdict = judgeMetric(metric, value, comparable, benchmark ? metric.value(benchmark) ?? null : null);
    const amount = basis && metric.amount ? metric.amount(row, basis) : null;
    // What the benchmark amounts to on the same basis as your amount (a day at your calories, or per 1,000 kcal).
    const benchmarkAmount = benchmark && basis && metric.amount ? metric.amount(benchmark, { ...basis, rawLandM2PerKg: benchmarkRawLandM2PerKg }) : null;
    const { percent, percentileTier, betterThanMean, meanTier, betterThanBenchmark, benchmarkTier, overall } = verdict;

    return (
        <div className="py-1.5 flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
            <span className="w-28 shrink-0 font-medium text-neutral-800">{metric.label}</span>
            <span className="w-52 shrink-0 text-neutral-700">
                {amount ? `${formatValue(amount.value, metric)} ${amount.unit}` : formatValue(value, metric)}
                {metric.label === 'Land use' && amount && (
                    <span className="block text-xs text-neutral-500">≈ {squareFeet(amount.value)} square</span>
                )}
            </span>
            <span className={`flex-1 ${percentileTier?.color ?? 'text-neutral-500'}`}>
                {percentileTier && percent !== null
                    ? <><strong>{percentileTier.name}</strong> — {ordinal(Math.round(percent))} percentile</>
                    : 'No comparison'}
            </span>
            <span className={`flex-1 ${meanTier?.color ?? 'text-neutral-500'}`}>
                {meanTier && betterThanMean !== null
                    ? <><strong>{meanTier.name}</strong> — {describeBetterBy(betterThanMean)}</>
                    : 'No average'}
            </span>
            <span className={`flex-1 ${benchmarkTier?.color ?? 'text-neutral-500'}`}>
                {benchmarkTier && betterThanBenchmark !== null
                    ? <><strong>{benchmarkTier.name}</strong> — {describeBetterBy(betterThanBenchmark)}{benchmarkAmount && ` (${formatValue(benchmarkAmount.value, metric)} ${benchmarkAmount.unit})`}</>
                    : 'No benchmark'}
            </span>
            <span className={`w-28 shrink-0 font-semibold ${overall?.color ?? 'text-neutral-500'}`}>{overall?.name ?? '—'}</span>
        </div>
    );
}
