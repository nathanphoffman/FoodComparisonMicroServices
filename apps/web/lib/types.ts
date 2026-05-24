export interface ISourced<T> {
  value: T;
  source_id: number;
  confidence: number;
}

export interface NutritionValue {
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

export interface Food {
  id: number;
  slug: string;
  name: string;
  type: 'plant' | 'animal';
  nutrition: ISourced<NutritionValue>[];
  human_food: 0 | 1;
  tags: string[];
}

export interface Animal {
  id: number;
  food_id: number;
  neuron_count: ISourced<number>[] | null;
  weight_kg: ISourced<number>[] | null;
  bycatch_animal_id: number | null;
  bycatch_amount: ISourced<number>[] | null;
  yield_fraction: ISourced<number>[] | null;
  pasture_ha_per_kg_output: ISourced<number>[] | null;
  pasture_green_water_l_per_ha: ISourced<number>[] | null;
  native_fraction: ISourced<number>[] | null;
  ch4_kg_per_kg_output: ISourced<number>[] | null;
  n2o_kg_per_kg_output: ISourced<number>[] | null;
  co2_kg_per_kg_output: ISourced<number>[] | null;
}

export interface Plant {
  id: number;
  food_id: number;
  yield_kg_ha: ISourced<number>[] | null;
  yield_fraction: ISourced<number>[] | null;
  water_per_kg: ISourced<number>[] | null;
  green_water_per_kg: ISourced<number>[] | null;
  blue_water_per_kg:  ISourced<number>[] | null;
  grey_water_per_kg:  ISourced<number>[] | null;
  soil_erosion: ISourced<number>[] | null;
  pesticide_kg_ha: ISourced<number>[] | null;
  fertilizer_kg_ha: ISourced<number>[] | null;
  emissions_per_kg: ISourced<number>[] | null;
  tillage_events_per_year: ISourced<number>[] | null;
  co2_capture_kg_ha_yr: ISourced<number>[] | null;
}

export interface Source {
  id: number;
  url: string;
  title: string;
  notes: string[] | null;
}

export interface AnimalFeed {
  id: number;
  animal_id: number;
  plant_id: number;
  kg_feed_per_kg_output: ISourced<number>[];
}

export interface PlantAnimalKill {
  id: number;
  plant_id: number;
  animal_id: number;
  kills_per_ha: ISourced<number>[] | null;
}

export interface Pesticide {
  id: number;
  name: string;
  freshwater_paf: ISourced<number>[];
  terrestrial_paf: ISourced<number>[] | null;
  insect_paf: ISourced<number>[] | null;
  bee_ld50: ISourced<number>[] | null;
}

export interface PlantPesticide {
  id: number;
  plant_id: number;
  pesticide_id: number;
  kg_ha: ISourced<number>[] | null;
}
