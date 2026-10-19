import { describe, expect, it } from 'vitest';
import { blendLandM2PerKg, blendDietNutrition } from './FoodDetails';
import { dietStub, type DietInput, type RawFood } from '../../types/FoodTableTypes';

const food = (slug: string, fields: Partial<RawFood>): RawFood => ({ ...dietStub(slug, slug), ...fields });
const FOODS = [food('rice', { calories: 1, protein: 0.2 }), food('beans', { calories: 4, protein: 0 })];
const half = (basis: DietInput['basis']): DietInput => ({
    slug: 'diet', name: 'Diet', basis, ingredients: [{ slug: 'rice', fraction: 0.5 }, { slug: 'beans', fraction: 0.5 }],
});

describe('blendDietNutrition', () => {
    it('averages by mass when the shares are masses', () => {
        const blend = blendDietNutrition(half('mass'), FOODS)!;
        expect(blend.protein).toBeCloseTo(0.1);
        expect(blend.calories).toBeCloseTo(2.5);
    });

    it('turns calorie shares into masses first, so the denser food weighs less', () => {
        // 0.5 / 1 = 0.5 g of rice and 0.5 / 4 = 0.125 g of beans: rice is 80% of the mass.
        expect(blendDietNutrition(half('calories'), FOODS)!.calories).toBeCloseTo(1.6);
    });

    it('has nothing to show when none of the ingredients exist', () => {
        expect(blendDietNutrition(half('mass'), [])).toBeNull();
    });
});

describe('blendLandM2PerKg', () => {
    const landOf = (slug: string) => ({ rice: 10, beans: 30 } as Record<string, number>)[slug];

    it('averages land by mass share', () => {
        expect(blendLandM2PerKg(half('mass'), FOODS, landOf)).toBeCloseTo(20);
    });

    it('ignores an ingredient with no land figure', () => {
        expect(blendLandM2PerKg(half('mass'), FOODS, slug => slug === 'rice' ? 10 : null)).toBeCloseTo(10);
    });
});
