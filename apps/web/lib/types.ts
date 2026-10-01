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
  // vitamins and minerals per gram, only when the source reports them (units in data/json/SCHEMA.md)
  vitamin_a?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  vitamin_e?: number;
  vitamin_k?: number;
  folate?: number;
  vitamin_b12?: number;
  vitamin_b6?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  zinc?: number;
  phosphorus?: number;
  selenium?: number;
}

export interface Food {
  id: number;
  slug: string;
  name: string;
  type: 'plant' | 'animal';
  nutrition: ISourced<NutritionValue>[];
  human_food: 0 | 1;
  tags: string[];
  notes: string | null;
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

/** One sourced figure exactly as stored in the data JSON (food_sources table). */
export interface SourcedFigure {
  value: number | Record<string, number | null>;
  confidence: number;
  region?: string;
  source: { id: number; url: string; title: string; note: string | null };
}

/** Returned by GET /api/foods/[slug]/details for the food detail modal. */
export interface FoodDetails {
  name: string;
  notes: string | null;
  /** Keyed by field name, e.g. 'yield_kg_ha', 'feed:corn', 'pesticide:Glyphosate'. */
  sources: Record<string, SourcedFigure[]>;
}
