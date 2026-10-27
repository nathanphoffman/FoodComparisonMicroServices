/** Adds up a list of numbers; 0 for an empty list. */
export function sumOf(values: number[]): number {
    let total = 0;

    for (const value of values) total += value;

    return total;
}

/** The mean of a list of numbers, or null for an empty list. */
export function averageOf(values: number[]): number | null {
    return values.length > 0 ? sumOf(values) / values.length : null;
}
