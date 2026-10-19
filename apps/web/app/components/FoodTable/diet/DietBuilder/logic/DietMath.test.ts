import { describe, expect, it } from 'vitest';
import { caloriesPerDayIn, levelForPercent, settingsOf, type BuilderFood } from './DietMath';
import { toPercents, type Saved } from './DietSaved';

const RICE_CALORIES_PER_GRAM = 1;
const BEANS_CALORIES_PER_GRAM = 4;
const FOODS: BuilderFood[] = [
    { slug: 'rice', name: 'Rice', calories: RICE_CALORIES_PER_GRAM },
    { slug: 'beans', name: 'Beans', calories: BEANS_CALORIES_PER_GRAM },
];
const HALF_AND_HALF = [{ slug: 'rice', name: 'Rice', level: 50 }, { slug: 'beans', name: 'Beans', level: 50 }];
const DIET = { basis: 'calories', calorieTarget: 2000, pillAbsorption: 100, supplements: [], ingredients: HALF_AND_HALF, daysBetween: 0.3 } as unknown as Saved;

describe('caloriesPerDayIn', () => {
    it('splits the daily calories by calorie share', () => {
        expect(caloriesPerDayIn(DIET, FOODS, 'rice')).toBe(1000);
    });

    it('splits by mass share: the same mass of a denser food is more calories', () => {
        const byMass = { ...DIET, basis: 'mass' } as Saved;
        expect(caloriesPerDayIn(byMass, FOODS, 'rice')).toBe(400);
        expect(caloriesPerDayIn(byMass, FOODS, 'beans')).toBe(1600);
    });

    it('has no answer without a daily total or for a food not in the diet', () => {
        expect(caloriesPerDayIn({ ...DIET, calorieTarget: null }, FOODS, 'rice')).toBeNull();
        expect(caloriesPerDayIn(DIET, FOODS, 'kale')).toBeNull();
    });
});

describe('levelForPercent', () => {
    it('finds the slider level that gives a food exactly that share', () => {
        const level = levelForPercent(HALF_AND_HALF, 0, 20);
        const withLevel = [{ ...HALF_AND_HALF[0], level }, HALF_AND_HALF[1]];
        expect(toPercents(withLevel)[0]).toBeCloseTo(20);
    });
});

describe('settingsOf', () => {
    it('adds up a supplement taken daily at full absorption', () => {
        const withIron = { ...DIET, supplements: [{ key: 'iron', dose: 18, perWeek: 7 }] } as Saved;
        expect(settingsOf(withIron, FOODS).supplements).toEqual({ iron: 18 });
    });

    it('scales a supplement by how many days a week it is taken', () => {
        const weekly = { ...DIET, supplements: [{ key: 'iron', dose: 14, perWeek: 1 }] } as Saved;
        expect(settingsOf(weekly, FOODS).supplements).toEqual({ iron: 2 });
    });
});
