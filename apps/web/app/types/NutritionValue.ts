import { ISourced } from '@/lib/types';
import { Sourced } from './Sourced';

export interface INutritionValue {
    calories: number;
    fat: number;
    sat_fat: number;
    protein: number;
    fiber: number;
    sodium: number | null;
    carbs: number | null;
    sugar: number | null;
    cholesterol: number | null;
    trans_fat: number | null;
}

export class NutritionValue implements INutritionValue {
    calories!: number;
    fat!: number;
    sat_fat!: number;
    protein!: number;
    fiber!: number;
    sodium!: number | null;
    carbs!: number | null;
    sugar!: number | null;
    cholesterol!: number | null;
    trans_fat!: number | null;

    constructor(data: INutritionValue) {
        Object.assign(this, data);
    }
}

export class SourcedNutritionalValue implements Sourced<NutritionValue> {
    value!: NutritionValue;
    source_id!: number;
    confidence!: number;

    constructor(data: ISourced<NutritionValue>) {
        Object.assign(this, data);
        this.value = new NutritionValue(data.value);
    }
}

export class SourcedNutritionalValueArray extends Array<SourcedNutritionalValue> {

    constructor(data: Array<SourcedNutritionalValue>) {
        super(...data);
    }

    weightedAverage(): NutritionValue {
        const confidenceTotal = this.reduce((sum, entry) => sum + entry.confidence, 0);

        const avgRequired = (field: 'calories' | 'fat' | 'sat_fat' | 'protein' | 'fiber') =>
            this.reduce((sum, e) => sum + e.value[field] * e.confidence, 0) / confidenceTotal;

        const avgOptional = (field: 'sodium' | 'carbs' | 'sugar' | 'cholesterol' | 'trans_fat'): number | null => {
            const entries = this.filter(e => e.value[field] != null);
            if (entries.length === 0) return null;
            const w = entries.reduce((acc, e) => acc + e.confidence, 0);
            return entries.reduce((sum, e) => sum + (e.value[field] as number) * e.confidence, 0) / w;
        };

        return {
            calories:       avgRequired('calories'),
            fat:            avgRequired('fat'),
            sat_fat:        avgRequired('sat_fat'),
            protein:        avgRequired('protein'),
            fiber:          avgRequired('fiber'),
            sodium:         avgOptional('sodium'),
            carbs:          avgOptional('carbs'),
            sugar:          avgOptional('sugar'),
            cholesterol:    avgOptional('cholesterol'),
            trans_fat:      avgOptional('trans_fat'),
        };
    }
}
