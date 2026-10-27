import { describe, expect, it } from 'vitest';
import { dailyNeeds, needsLabel } from './FoodTableRda';

describe('dailyNeeds', () => {
    it('gives every nutrient a positive need', () => {
        for (const need of Object.values(dailyNeeds('us', null, null, null))) {
            expect(need).toBeGreaterThan(0);
        }
    });

    it('averages the sexes when none is set', () => {
        const male = dailyNeeds('us', 'male', null, null).zinc;
        const female = dailyNeeds('us', 'female', null, null).zinc;
        expect(dailyNeeds('us', null, null, null).zinc).toBeCloseTo((male + female) / 2, 5);
    });

    it('needs more for a heavier body, but not in direct proportion', () => {
        const light = dailyNeeds('us', 'male', 30, 150).zinc;
        const heavy = dailyNeeds('us', 'male', 30, 300).zinc;
        expect(heavy).toBeGreaterThan(light);
        expect(heavy / light).toBeLessThan(2);
    });
});

describe('needsLabel', () => {
    it('only says "adjusted for you" once something is set', () => {
        expect(needsLabel('us', null, null, null)).not.toContain('adjusted');
        expect(needsLabel('us', 'female', null, null)).toContain('adjusted for you');
    });
});
