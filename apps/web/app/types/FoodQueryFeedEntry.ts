import { SourcedNumberArray } from './Sourced';

export interface IFoodQueryFeedEntry {
    plant: string;
    kg_feed_per_kg_output: SourcedNumberArray;
}

export class FoodQueryFeedEntry implements IFoodQueryFeedEntry {
    plant!: string;
    kg_feed_per_kg_output!: SourcedNumberArray;

    constructor(data: IFoodQueryFeedEntry) {
        Object.assign(this, data);
        this.kg_feed_per_kg_output = new SourcedNumberArray(data.kg_feed_per_kg_output);
    }
}
