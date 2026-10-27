import { describe, expect, it } from 'vitest';
import { equalLevels, toShares } from './percentLevels';

describe('toShares', () => {
    it('turns levels into percentages that sum to 100', () => {
        const shares = toShares({ first: 10, second: 5 });
        expect(shares.first).toBeCloseTo(66.67, 1);
        expect(shares.second).toBeCloseTo(33.33, 1);
    });

    it('gives every slider 0 when all are at "Don\'t Care"', () => {
        expect(toShares({ first: 0, second: 0 })).toEqual({ first: 0, second: 0 });
    });
});

describe('equalLevels', () => {
    it('puts every slider at the same level, so the shares are equal', () => {
        const shares = toShares(equalLevels(['first', 'second', 'third', 'fourth']));
        expect(shares).toEqual({ first: 25, second: 25, third: 25, fourth: 25 });
    });
});
