import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSaved, positiveOrNull, readDietFile, sanitize, toPercents, type Saved } from './DietSaved';

const KNOWN_FOODS = [{ slug: 'rice' }, { slug: 'beans' }];
const A_DIET = {
    basis: 'mass', calorieTarget: 2000, sex: 'female', age: 30, weightLb: 140, activity: 0, daysBetween: 0.3, pillAbsorption: 75,
    supplements: [], ingredients: [{ slug: 'rice', name: 'Rice', level: 50 }, { slug: 'gone', name: 'Gone', level: 50 }],
} as Saved;

afterEach(() => vi.restoreAllMocks());

describe('sanitize', () => {
    it('rejects data that has no ingredient list', () => {
        expect(sanitize(null, KNOWN_FOODS)).toBeNull();
        expect(sanitize({} as Saved, KNOWN_FOODS)).toBeNull();
    });

    it('drops foods that no longer exist and keeps the rest', () => {
        expect(sanitize(A_DIET, KNOWN_FOODS)!.ingredients.map(ingredient => ingredient.slug)).toEqual(['rice']);
    });

    it('replaces nonsense values with safe defaults', () => {
        const messy = { ...A_DIET, calorieTarget: -5, sex: 'other', activity: 99, pillAbsorption: 150, basis: 'volume' } as unknown as Saved;
        const clean = sanitize(messy, KNOWN_FOODS)!;
        expect(clean).toMatchObject({ calorieTarget: null, sex: null, basis: 'calories', pillAbsorption: 75 });
        expect(clean.activity).toBe(0);
    });
});

describe('positiveOrNull', () => {
    it('only accepts numbers above zero', () => {
        expect([positiveOrNull(''), positiveOrNull('0'), positiveOrNull('abc'), positiveOrNull('-3')]).toEqual([null, null, null, null]);
        expect(positiveOrNull('12.5')).toBe(12.5);
    });
});

describe('toPercents', () => {
    it('gives each ingredient its share of the total level', () => {
        expect(toPercents([{ slug: 'a', name: 'A', level: 30 }, { slug: 'b', name: 'B', level: 10 }])).toEqual([75, 25]);
    });

    it('gives everything 0 when every slider is at 0', () => {
        expect(toPercents([{ slug: 'a', name: 'A', level: 0 }])).toEqual([0]);
    });
});

describe('loadSaved', () => {
    const withStoredValue = (value: string | null) =>
        vi.stubGlobal('localStorage', { getItem: () => value });

    it('starts empty, with no complaint, when nothing was saved', () => {
        withStoredValue(null);
        expect(loadSaved('key', KNOWN_FOODS)).toMatchObject({ problem: null, saved: { ingredients: [] } });
    });

    it('says so, and logs, when the saved diet is corrupt', () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
        withStoredValue('{not json');
        expect(loadSaved('key', KNOWN_FOODS).problem).toMatch(/couldn't be read/);
        expect(logged).toHaveBeenCalled();
    });
});

describe('readDietFile', () => {
    const fileOf = (text: string) => new File([text], 'diet.json');

    it('explains why a file that is not JSON was refused', async () => {
        await expect(readDietFile(fileOf('hello'), KNOWN_FOODS)).rejects.toThrow(/valid JSON/);
    });

    it('explains why JSON without a food list was refused', async () => {
        await expect(readDietFile(fileOf('{"a":1}'), KNOWN_FOODS)).rejects.toThrow(/no list of foods/);
    });

    it('counts the foods it had to skip', async () => {
        const result = await readDietFile(fileOf(JSON.stringify(A_DIET)), KNOWN_FOODS);
        expect(result.droppedFoodCount).toBe(1);
        expect(result.saved.ingredients).toHaveLength(1);
    });
});
