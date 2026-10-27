import { describe, expect, it } from 'vitest';
import { averageOf, sumOf } from './sumOf';

describe('sumOf', () => {
    it('adds the numbers', () => {
        expect(sumOf([1, 2, 3.5])).toBe(6.5);
    });

    it('is 0 for an empty list', () => {
        expect(sumOf([])).toBe(0);
    });
});

describe('averageOf', () => {
    it('is the mean of the numbers', () => {
        expect(averageOf([2, 4, 9])).toBe(5);
    });

    it('is null for an empty list, so callers can tell "no data" from zero', () => {
        expect(averageOf([])).toBeNull();
    });
});
