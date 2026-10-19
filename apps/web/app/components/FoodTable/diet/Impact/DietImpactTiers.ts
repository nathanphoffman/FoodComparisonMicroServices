// How the diet compares with the other foods: the share of them it beats. Average is the middle 10%, then each
// 10% further out is above/below average, then good/bad, and past that very good/very bad.
export const TIERS = [
    { min: 75, score: 3, name: 'Very good',     color: 'text-blue-600' },
    { min: 65, score: 2, name: 'Good',          color: 'text-green-600' },
    { min: 55, score: 1, name: 'Above average', color: 'text-lime-600' },
    { min: 45, score: 0, name: 'Average',       color: 'text-yellow-600' },
    { min: 35, score: -1, name: 'Below average', color: 'text-amber-600' },
    { min: 25, score: -2, name: 'Bad',           color: 'text-orange-600' },
    { min: 0,  score: -3, name: 'Very bad',      color: 'text-red-600' },
];

// The second verdict: how far the diet is from the average American diet (built from this dataset's own foods and
// scored the same way), not its rank among single foods. Within 10% of the benchmark is average; each further 15%,
// 25%, then beyond 50% steps through above/below average, good/bad and very good/very bad.
export const DISTANCE_TIERS = [
    { min: 0.5,   score: 3, name: 'Very good',     color: 'text-blue-600' },
    { min: 0.25,  score: 2, name: 'Good',          color: 'text-green-600' },
    { min: 0.1,   score: 1, name: 'Above average', color: 'text-lime-600' },
    { min: -0.1,  score: 0, name: 'Average',       color: 'text-yellow-600' },
    { min: -0.25, score: -1, name: 'Below average', color: 'text-amber-600' },
    { min: -0.5,  score: -2, name: 'Bad',           color: 'text-orange-600' },
    { min: -Infinity, score: -3, name: 'Very bad',  color: 'text-red-600' },
];

// The net verdict: each column's tier is worth -3 (very bad) to +3 (very good); the overall is their average, rounded
// to the nearest tier. If only one column has a verdict, that one stands alone.
const OVERALL_TIERS = [...TIERS];
export function overallTier(scores: number[]) {
    if (scores.length === 0) return null;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    // Halves round away from zero, so +1.5 and -1.5 land the same distance from average.
    const rounded = Math.sign(average) * Math.round(Math.abs(average));
    return OVERALL_TIERS.find(tier => tier.score === rounded)!;
}
