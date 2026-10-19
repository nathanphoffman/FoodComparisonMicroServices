import { describe, expect, it } from 'vitest';
import { getColor, getTone } from './FoodTableStyles';

describe('lower-is-better measures', () => {
    it('are good under the low cutoff, fair under the high one, bad from there', () => {
        expect([1.9, 2, 9.9, 10].map(value => getTone('emissions', value))).toEqual(['good', 'fair', 'fair', 'bad']);
        expect([1_999, 2_000, 8_000].map(value => getTone('water', value))).toEqual(['good', 'fair', 'bad']);
    });
});

describe('higher-is-better measures', () => {
    it('nutrition needs to be strictly above a cutoff', () => {
        expect([3, 3.01, 1, 1.01, 0].map(value => getTone('nutritionScore', value))).toEqual(['fair', 'good', 'bad', 'fair', 'bad']);
    });

    it('improvement counts a ratio equal to the cutoff', () => {
        expect([1.5, 0.7, 0.69].map(value => getTone('improvement', value))).toEqual(['good', 'fair', 'bad']);
    });
});

describe('harm scores', () => {
    it('are good at zero, then fair until each trillion-scale cutoff', () => {
        expect([0, 1, 1e12, 1e13].map(value => getTone('directKill', value))).toEqual(['good', 'fair', 'poor', 'bad']);
        expect([0, 1e12, 1e13, 1e14].map(value => getTone('sentientHarm', value))).toEqual(['good', 'poor', 'bad', 'worst']);
    });
});

describe('getColor', () => {
    it('picks the colour set for the measure', () => {
        expect(getColor('emissions', 1)).toBe('bg-green-100 text-green-700');
        expect(getColor('water', 1)).toBe('text-sky-600');
        expect(getColor('sentientHarm', 0)).toBe('text-green-600 font-medium');
    });
});
