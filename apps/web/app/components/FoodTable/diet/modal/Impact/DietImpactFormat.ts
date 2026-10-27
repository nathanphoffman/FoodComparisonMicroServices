import { formatIntelligenceValue } from '../../../nutrition/FoodTableCalculations';
import type { Metric } from './DietImpactMetrics';

const FEET_PER_METER = 3.28084;

// An area as the sides of a square of the same size, in feet, to picture square meters: 30 m² is about 18 × 18 ft.
export function squareFeet(areaM2: number): string {
    const side = Math.sqrt(areaM2) * FEET_PER_METER;
    const text = side >= 100 ? Math.round(side).toLocaleString() : side.toFixed(1);

    return `${text} × ${text} ft`;
}

const TEEN_RANGE = { first: 11, last: 13 };  // 11th, 12th, 13th break the st/nd/rd pattern

// 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st.
export function ordinal(count: number): string {
    const lastTwo = count % 100;

    if (lastTwo >= TEEN_RANGE.first && lastTwo <= TEEN_RANGE.last) return `${count}th`;

    return `${count}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[count % 10] ?? 'th'}`;
}

export function formatValue(value: number, metric: Metric): string {
    // Sentient harm is shown with the table's M / G / T / P suffixes.
    if (metric.label === 'Sentient harm') return formatIntelligenceValue(value);

    return Math.abs(value) >= 100 ? Math.round(value).toLocaleString() : value.toPrecision(3);
}
