import type { ScoredRow } from '../../scoring/FoodTableSort';
import type { Basis, Metric } from './DietImpactMetrics';
import { TIERS, DISTANCE_TIERS, overallTier } from './DietImpactTiers';
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
        <div className="py-1.5 flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
            <span className="w-28 shrink-0 font-medium text-neutral-800">{metric.label}</span>
            <span className="w-52 shrink-0 text-neutral-700">
                {amount ? `${formatValue(amount.value, metric)} ${amount.unit}` : formatValue(value, metric)}
                {metric.label === 'Land use' && amount && (
                    <span className="block text-xs text-neutral-500">≈ {squareFeet(amount.value)} square</span>
                )}
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
}
