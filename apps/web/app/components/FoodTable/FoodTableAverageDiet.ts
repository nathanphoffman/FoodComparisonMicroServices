import type { CustomFoodInput } from './FoodTableTypes';

// A benchmark "average American diet" built from this dataset's own foods, so every measure (sentient harm included)
// is in the same units as the user's diet. It is scored as an extra hidden custom food and never shown as a table row.
//
// Calorie shares follow USDA ERS loss-adjusted food availability for 2010 (2,481 kcal a person a day):
// grains 581 kcal (23%), added fats and oils 518 (21%), meat, poultry and fish 416 (17%), nuts 72 (3%), with 70% of
// calories from plants and 30% from animals. Added sugars, dairy, eggs, fruit, vegetables, legumes and alcohol are
// from memory of the same series and approximate. Within each group the split across our foods is a rough guess at
// typical US eating, so this is a benchmark, not a measurement.
export const AVERAGE_DIET_SLUG = 'average-us-diet';
export const AVERAGE_DIET_NAME = 'Average American Diet';

// [food slug, percent of calories]
const SHARES: [string, number][] = [
    // Grains (23.4)
    ['white-bread', 7], ['whole-wheat-bread', 1.5], ['pasta', 3.5], ['flour-tortillas', 1.8], ['corn-flakes', 1], ['oat-cereal', 1],
    ['rice', 3], ['white-flour', 3], ['corn', 1.6],
    // Added fats and oils (20.9)
    ['soybean-oil', 12], ['canola-oil', 3], ['palm-oil', 1.5], ['olive-oil', 0.8], ['corn-oil', 0.5], ['butter', 1.5],
    ['lard', 0.8], ['sunflower-oil', 0.4], ['peanut-oil', 0.4],
    // Meat, poultry and fish (16.8)
    ['chicken', 6], ['beef', 5], ['pork', 3.3], ['turkey', 0.9], ['tuna', 0.4], ['shrimp', 0.4], ['salmon', 0.4], ['pollock', 0.4],
    // Nuts (2.9)
    ['peanut-butter', 1.5], ['almonds', 0.7], ['walnuts', 0.3], ['cashews', 0.2], ['pecans', 0.2],
    // Added sugars and sweeteners (14.8)
    ['cane-sugar', 6], ['corn-syrup', 6], ['brown-sugar', 0.8], ['honey', 0.5], ['maple-syrup', 0.2], ['dark-chocolate', 1.3],
    // Dairy (9.0)
    ['milk', 3], ['cheddar', 1.5], ['mozzarella', 2], ['yogurt', 0.7], ['ice-cream', 1], ['cream-cheese', 0.3], ['heavy-cream', 0.5],
    // Eggs (1.2)
    ['egg', 1.2],
    // Fruit (3.2)
    ['banana', 0.8], ['apple', 0.7], ['orange', 0.4], ['orange-juice', 0.6], ['grapes', 0.3], ['strawberries', 0.2], ['watermelon', 0.1], ['avocado', 0.1],
    // Vegetables (4.2)
    ['potato', 2.1], ['tomato', 0.6], ['sweet-corn', 0.3], ['onion', 0.2], ['romaine-lettuce', 0.1], ['carrot', 0.2], ['broccoli', 0.2],
    ['cabbage', 0.1], ['bell-pepper', 0.1], ['cucumber', 0.1], ['green-beans', 0.1], ['spinach', 0.1],
    // Legumes (1.0)
    ['pinto-beans', 0.3], ['black-beans', 0.2], ['tofu', 0.1], ['hummus', 0.2], ['lentils', 0.1], ['peas', 0.1],
    // Alcohol (1.5)
    ['beer', 1], ['wine', 0.5],
];

export function averageDietInput(foodSlugs: Set<string>): CustomFoodInput {
    // Only foods that exist in the loaded data, renormalised so a missing food doesn't shrink the diet.
    const available = SHARES.filter(([slug]) => foodSlugs.has(slug));
    const total = available.reduce((sum, [, percent]) => sum + percent, 0);
    return {
        slug: AVERAGE_DIET_SLUG,
        name: AVERAGE_DIET_NAME,
        basis: 'calories',
        ingredients: available.map(([slug, percent]) => ({ slug, fraction: percent / total })),
    };
}
