import { SourcedNumberArray } from './Sourced';
import { FoodQueryPesticide } from './FoodQueryPesticide';
import { FoodQueryAnimalKill } from './FoodQueryAnimalKill';

export interface IFoodQueryPlant {
    yield_kg_ha: SourcedNumberArray | null;
    water_per_kg: SourcedNumberArray | null;
    soil_erosion: SourcedNumberArray | null;
    pesticide_kg_ha: SourcedNumberArray | null;
    fertilizer_kg_ha: SourcedNumberArray | null;
    emissions_per_kg: SourcedNumberArray | null;
    tillage_events_per_year: SourcedNumberArray | null;
    co2_capture_kg_ha_yr: SourcedNumberArray | null;
    pesticides: FoodQueryPesticide[] | null;
    animal_kills: FoodQueryAnimalKill[] | null;
}

export class FoodQueryPlant implements IFoodQueryPlant {
    yield_kg_ha!: SourcedNumberArray | null;
    water_per_kg!: SourcedNumberArray | null;
    soil_erosion!: SourcedNumberArray | null;
    pesticide_kg_ha!: SourcedNumberArray | null;
    fertilizer_kg_ha!: SourcedNumberArray | null;
    emissions_per_kg!: SourcedNumberArray | null;
    tillage_events_per_year!: SourcedNumberArray | null;
    co2_capture_kg_ha_yr!: SourcedNumberArray | null;
    pesticides!: FoodQueryPesticide[] | null;
    animal_kills!: FoodQueryAnimalKill[] | null;

    constructor(data: IFoodQueryPlant) {
        Object.assign(this, data);
        this.yield_kg_ha = data.yield_kg_ha === null ? null : new SourcedNumberArray(data.yield_kg_ha);
        this.water_per_kg = data.water_per_kg === null ? null : new SourcedNumberArray(data.water_per_kg);
        this.soil_erosion = data.soil_erosion === null ? null : new SourcedNumberArray(data.soil_erosion);
        this.pesticide_kg_ha = data.pesticide_kg_ha === null ? null : new SourcedNumberArray(data.pesticide_kg_ha);
        this.fertilizer_kg_ha = data.fertilizer_kg_ha === null ? null : new SourcedNumberArray(data.fertilizer_kg_ha);
        this.emissions_per_kg = data.emissions_per_kg === null ? null : new SourcedNumberArray(data.emissions_per_kg);
        this.tillage_events_per_year = data.tillage_events_per_year === null ? null : new SourcedNumberArray(data.tillage_events_per_year);
        this.co2_capture_kg_ha_yr = data.co2_capture_kg_ha_yr === null ? null : new SourcedNumberArray(data.co2_capture_kg_ha_yr);
        this.pesticides = data.pesticides === null ? null : data.pesticides.map(pesticide => new FoodQueryPesticide(pesticide));
        this.animal_kills = data.animal_kills === null ? null : data.animal_kills.map(kill => new FoodQueryAnimalKill(kill));
    }
}
