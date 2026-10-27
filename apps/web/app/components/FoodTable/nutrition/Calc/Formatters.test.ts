import { describe, expect, it } from 'vitest';
import { formatIntelligenceValue, formatNeurons, formatYears } from './Formatters';

describe('formatYears', () => {
    it('says none for no time', () => {
        expect(formatYears(0)).toBe('none');
    });

    it('uses days under a month, with at least one day', () => {
        expect(formatYears(0.02)).toBe('7 days');
        expect(formatYears(0.0001)).toBe('1 day');
    });

    it('uses months under a year', () => {
        expect(formatYears(0.5)).toBe('6 months');
    });

    it('uses years from one up, dropping a trailing .0', () => {
        expect(formatYears(1)).toBe('1 year');
        expect(formatYears(2.5)).toBe('2.5 years');
        expect(formatYears(12)).toBe('12 years');
    });
});

describe('formatNeurons', () => {
    it('shortens thousands, millions and billions', () => {
        expect(formatNeurons(950)).toBe('950');
        expect(formatNeurons(4_000)).toBe('4K');
        expect(formatNeurons(760_000_000)).toBe('760M');
        expect(formatNeurons(86_000_000_000)).toBe('86B');
    });
});

describe('formatIntelligenceValue', () => {
    it('uses M, G, T and P suffixes for large values', () => {
        expect(formatIntelligenceValue(2_500_000)).toBe('2.5M');
        expect(formatIntelligenceValue(3e9)).toBe('3.0G');
        expect(formatIntelligenceValue(4e12)).toBe('4.0T');
        expect(formatIntelligenceValue(5e15)).toBe('5.0P');
    });

    it('rounds small values to whole numbers', () => {
        expect(formatIntelligenceValue(12.6)).toBe('13');
    });
});
