import { describe, expect, it } from 'vitest';
import type { Metric } from './DietImpactMetrics';
import { betterBy, describeBetterBy, judgeMetric } from './DietImpactVerdict';

const LOWER_IS_BETTER = { label: 'Water', value: () => null, lowerIsBetter: true } as Metric;
const HIGHER_IS_BETTER = { label: 'Nutrition score', value: () => null, lowerIsBetter: false } as Metric;

describe('betterBy', () => {
    it('is positive when the diet beats the reference, whichever direction is better', () => {
        expect(betterBy(50, 100, true)).toBe(0.5);
        expect(betterBy(150, 100, false)).toBe(0.5);
    });

    it('is negative when the diet falls short', () => {
        expect(betterBy(150, 100, true)).toBe(-0.5);
    });

    it('has no answer without a usable reference', () => {
        expect(betterBy(5, null, true)).toBeNull();
        expect(betterBy(5, 0, true)).toBeNull();
    });
});

describe('describeBetterBy', () => {
    it('says better or worse, and stops counting at 999%', () => {
        expect([0.4, -0.12, 25].map(describeBetterBy)).toEqual(['40% better', '12% worse', '999% better']);
    });
});

describe('judgeMetric', () => {
    it('counts the share of other foods the diet beats, using the right direction', () => {
        const others = [1, 2, 3, 4];
        expect(judgeMetric(LOWER_IS_BETTER, 2.5, others, null).percent).toBe(50);
        expect(judgeMetric(HIGHER_IS_BETTER, 2.5, others, null).percent).toBe(50);
        expect(judgeMetric(LOWER_IS_BETTER, 0.5, others, null).percent).toBe(100);
    });

    it('gives no verdict when there is nothing to compare with', () => {
        const verdict = judgeMetric(LOWER_IS_BETTER, 5, [], null);
        expect(verdict).toMatchObject({ percent: null, percentileTier: null, meanTier: null, benchmarkTier: null, overall: null });
    });

    it('rates a diet far below the average and benchmark on a lower-is-better measure as very good', () => {
        const verdict = judgeMetric(LOWER_IS_BETTER, 10, [100, 100, 100], 100);
        expect(verdict.percentileTier?.name).toBe('Very good');
        expect(verdict.meanTier?.name).toBe('Very good');
        expect(verdict.benchmarkTier?.name).toBe('Very good');
        expect(verdict.overall?.name).toBe('Very good');
    });
});
