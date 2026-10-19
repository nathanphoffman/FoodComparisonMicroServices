import type { RawFood } from '../types/FoodTableTypes';
import type { ScoredRow } from './FoodTableSort';

/**
 * Rank by Improvement (1 = best) among the rows on screen, whatever the table is sorted by.
 * Rows without an Improvement score get no rank; tied scores share a rank.
 */
export function rankByImprovement(rows: RawFood[], scored: Map<string, ScoredRow>) {
    const scores = rows.flatMap(food => {
        const score = scored.get(food.slug)?.final_score;
        return score == null ? [] : [{ slug: food.slug, score }];
    });
    const ranks = new Map(scores.map(({ slug, score }) => [slug, 1 + scores.filter(other => other.score > score).length]));
    return { ranks, rankedCount: scores.length };
}
