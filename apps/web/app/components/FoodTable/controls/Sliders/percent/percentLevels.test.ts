import { describe, expect, it } from 'vitest';
import { equalLevels, toShares } from './percentLevels';

describe('toShares', () => {
    it('turns levels into percentages that sum to 100', () => {
        const shares = toShares({ a: 10, b: 5 });
        expect(shares.a).toBeCloseTo(66.67, 1);
        expect(shares.b).toBeCloseTo(33.33, 1);
    });

    it('gives every slider 0 when all are at "Don\'t Care"', () => {
        expect(toShares({ a: 0, b: 0 })).toEqual({ a: 0, b: 0 });
    });
});

describe('equalLevels', () => {
    it('puts every slider at the same level, so the shares are equal', () => {
        const shares = toShares(equalLevels(['a', 'b', 'c', 'd']));
        expect(shares).toEqual({ a: 25, b: 25, c: 25, d: 25 });
    });
});
