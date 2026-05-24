import { ISourced } from '@/lib/types';

export class Sourced<T> implements ISourced<T> {
    value!: T;
    source_id!: number;
    confidence!: number;

    constructor(data: ISourced<T>) {
        Object.assign(this, data);
    }
}

export class SourcedNumber implements Sourced<number> {
    value!: number;
    source_id!: number;
    confidence!: number;

    constructor(data: ISourced<number>) {
        Object.assign(this, data);
    }
}

export class SourcedNumberArray extends Array<SourcedNumber> {

    constructor(data: Array<SourcedNumber>) {
        super(...data);
    }

    weightedAverage(): number {
        const weightedTotal = this.reduce((sum, entry) => sum + entry.value * entry.confidence, 0);
        const confidenceTotal = this.reduce((sum, entry) => sum + entry.confidence, 0);

        return weightedTotal / confidenceTotal;
    }
}

export class SourcedArray<T> extends Array<Sourced<T>> {

    constructor(data: Array<Sourced<T>>) {
        super(...data);
    }
}
