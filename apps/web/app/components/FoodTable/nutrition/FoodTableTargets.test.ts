import { describe, expect, it } from 'vitest';
import { COLOR_SCALES, describeScale, scaleColor, targetColor } from './FoodTableTargets';

describe('scaleColor for something to reach', () => {
    it('goes red, orange, yellow, green, then blue as the percent rises', () => {
        const colors = [10, 60, 100, 200, 300].map(percent => targetColor(percent, 'min'));
        expect(colors).toEqual(['text-red-400', 'text-orange-300', 'text-yellow-300', 'text-green-300', 'text-blue-300']);
    });

    it('treats a cutoff as the start of the next color', () => {
        expect(targetColor(50, 'min')).toBe('text-orange-300');
    });
});

describe('vitamins and minerals', () => {
    it('turn blue sooner, above 200%', () => {
        expect(scaleColor(200, COLOR_SCALES.nutrient)).toBe('text-green-300');
        expect(scaleColor(201, COLOR_SCALES.nutrient)).toBe('text-blue-300');
    });
});

describe('a limit', () => {
    it('is best far under it and bad over it', () => {
        expect(targetColor(50, 'max')).toBe('text-blue-300');
        expect(targetColor(100, 'max')).toBe('text-green-300');
        expect(targetColor(151, 'max')).toBe('text-red-400');
    });
});

describe('a range', () => {
    it('is best near 100% from either side', () => {
        expect([95, 105].map(percent => targetColor(percent, 'range'))).toEqual(['text-blue-300', 'text-blue-300']);
        expect([60, 140].map(percent => targetColor(percent, 'range'))).toEqual(['text-yellow-300', 'text-yellow-300']);
        expect(targetColor(30, 'range')).toBe('text-red-400');
    });
});

describe('describeScale', () => {
    it('words the cutoffs the way the explainer shows them', () => {
        expect(describeScale(COLOR_SCALES.nutrient)).toBe('under 50% is red, 50–75% orange, 75–125% yellow, 125–200% green and over 200% blue');
    });
});
