import { describe, expect, it } from 'vitest';
import { blendLandM2PerKg, blendNutritionDetail } from './FoodDetails';
import { customFoodStub, type CustomFoodInput, type RawFood } from '../../Types/FoodTableTypes';

const food = (slug: string, fields: Partial<RawFood>): RawFood => ({ ...customFoodStub(slug, slug), ...fields });
const FOODS = [food('rice', { calories: 1, protein: 0.2 }), food('beans', { calories: 4, protein: 0 })];
const half = (basis: CustomFoodInput['basis']): CustomFoodInput => ({
    slug: 'meal', name: 'Meal', basis, ingredients: [{ slug: 'rice', fraction: 0.5 }, { slug: 'beans', fraction: 0.5 }],
});

describe('blendNutritionDetail', () => {
    it('averages by mass when the shares are masses', () => {
        const blend = blendNutritionDetail(half('mass'), FOODS)!;
        expect(blend.protein).toBeCloseTo(0.1);
        expect(blend.calories).toBeCloseTo(2.5);
    });

    it('turns calorie shares into masses first, so the denser food weighs less', () => {
        // 0.5 / 1 = 0.5 g of rice and 0.5 / 4 = 0.125 g of beans: rice is 80% of the mass.
        expect(blendNutritionDetail(half('calories'), FOODS)!.calories).toBeCloseTo(1.6);
    });

    it('has nothing to show when none of the ingredients exist', () => {
        expect(blendNutritionDetail(half('mass'), [])).toBeNull();
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
