import { SourcedNumberArray } from './Sourced';

export interface IFoodQueryAnimalKill {
    animal: string;
    kills_per_ha: SourcedNumberArray | null;
}

export class FoodQueryAnimalKill implements IFoodQueryAnimalKill {
    animal!: string;
    kills_per_ha!: SourcedNumberArray | null;

    constructor(data: IFoodQueryAnimalKill) {
        Object.assign(this, data);
        this.kills_per_ha = data.kills_per_ha === null ? null : new SourcedNumberArray(data.kills_per_ha);
    }
}
