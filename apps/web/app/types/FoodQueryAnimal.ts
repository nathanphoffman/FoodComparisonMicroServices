import { SourcedNumberArray } from './Sourced';
import { FoodQueryFeedEntry } from './FoodQueryFeedEntry';

export interface IFoodQueryAnimal {
    neuron_count: SourcedNumberArray | null;
    weight_kg: SourcedNumberArray | null;
    yield_fraction: SourcedNumberArray | null;
    pasture_ha_per_kg_output: SourcedNumberArray | null;
    native_fraction: SourcedNumberArray | null;
    bycatch: { animal: string; amount: SourcedNumberArray } | null;
    feed: FoodQueryFeedEntry[] | null;
}

export class FoodQueryAnimal implements IFoodQueryAnimal {
    neuron_count!: SourcedNumberArray | null;
    weight_kg!: SourcedNumberArray | null;
    yield_fraction!: SourcedNumberArray | null;
    pasture_ha_per_kg_output!: SourcedNumberArray | null;
    native_fraction!: SourcedNumberArray | null;
    bycatch!: { animal: string; amount: SourcedNumberArray } | null;
    feed!: FoodQueryFeedEntry[] | null;

    constructor(data: IFoodQueryAnimal) {
        Object.assign(this, data);
        this.neuron_count = data.neuron_count === null ? null : new SourcedNumberArray(data.neuron_count);
        this.weight_kg = data.weight_kg === null ? null : new SourcedNumberArray(data.weight_kg);
        this.yield_fraction = data.yield_fraction === null ? null : new SourcedNumberArray(data.yield_fraction);
        this.pasture_ha_per_kg_output = data.pasture_ha_per_kg_output === null ? null : new SourcedNumberArray(data.pasture_ha_per_kg_output);
        this.native_fraction = data.native_fraction === null ? null : new SourcedNumberArray(data.native_fraction);
        this.bycatch = data.bycatch === null ? null : { animal: data.bycatch.animal, amount: new SourcedNumberArray(data.bycatch.amount) };
        this.feed = data.feed === null ? null : data.feed.map(entry => new FoodQueryFeedEntry(entry));
    }
}
