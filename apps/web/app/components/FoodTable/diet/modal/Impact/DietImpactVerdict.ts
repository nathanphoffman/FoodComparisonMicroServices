import type { Metric } from './DietImpactMetrics';
import { TIERS, DISTANCE_TIERS, overallTier } from './DietImpactTiers';

// A share worse than this many percent is shown as this many; the exact figure stops being useful.
const MAX_SHOWN_PERCENT = 999;

type Tier = typeof TIERS[number];

/**
 * How much better (positive) or worse (negative) `value` is than `reference`, as a share of the reference.
 * null when there is no reference, or it is 0 so a share can't be worked out.
 */
export function betterBy(value: number, reference: number | null, lowerIsBetter: boolean): number | null {
    if (reference == null || reference === 0) return null;
    return (lowerIsBetter ? reference - value : value - reference) / Math.abs(reference);
}

/** "40% better" or "12% worse" for a share from betterBy. */
export function describeBetterBy(share: number): string {
    return `${Math.min(Math.round(Math.abs(share) * 100), MAX_SHOWN_PERCENT)}% ${share >= 0 ? 'better' : 'worse'}`;
}

export type Verdict = {
    /** Share (0–100) of the other foods the diet beats; null with nothing to compare. */
    percent: number | null;
    percentileTier: Tier | null;
    /** How much better the diet is than the average food, and the tier for it. */
    betterThanMean: number | null;
    meanTier: Tier | null;
    /** How much better the diet is than the benchmark diet, and the tier for it. */
    betterThanBenchmark: number | null;
    benchmarkTier: Tier | null;
    /** The three tiers averaged into one verdict. */
    overall: Tier | null;
};

/** Judges one measure of the diet against the other foods' values and against the benchmark diet's value. */
export function judgeMetric(metric: Metric, value: number, others: number[], benchmarkValue: number | null): Verdict {
    const beaten = others.filter(other => metric.lowerIsBetter ? other > value : other < value).length;
    const percent = others.length > 0 ? (beaten / others.length) * 100 : null;
    const percentileTier = percent === null ? null : TIERS.find(tier => percent >= tier.min)!;

    const mean = others.length > 0 ? others.reduce((sum, other) => sum + other, 0) / others.length : null;
    const betterThanMean = betterBy(value, mean, metric.lowerIsBetter);
    const meanTier = betterThanMean === null ? null : DISTANCE_TIERS.find(tier => betterThanMean >= tier.min)!;

    const betterThanBenchmark = betterBy(value, benchmarkValue, metric.lowerIsBetter);
    const benchmarkTier = betterThanBenchmark === null ? null : DISTANCE_TIERS.find(tier => betterThanBenchmark >= tier.min)!;

    const overall = overallTier([percentileTier, meanTier, benchmarkTier].flatMap(tier => tier ? [tier.score] : []));
    return { percent, percentileTier, betterThanMean, meanTier, betterThanBenchmark, benchmarkTier, overall };
}
