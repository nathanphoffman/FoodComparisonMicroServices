import { SourcedNumberArray } from './Sourced';

export interface IFoodQueryPesticide {
    name: string;
    freshwater_paf: SourcedNumberArray;
    kg_ha: SourcedNumberArray | null;
}

export class FoodQueryPesticide implements IFoodQueryPesticide {
    name!: string;
    freshwater_paf!: SourcedNumberArray;
    kg_ha!: SourcedNumberArray | null;

    constructor(data: IFoodQueryPesticide) {
        Object.assign(this, data);
        this.freshwater_paf = new SourcedNumberArray(data.freshwater_paf);
        this.kg_ha = data.kg_ha === null ? null : new SourcedNumberArray(data.kg_ha);
    }
}
