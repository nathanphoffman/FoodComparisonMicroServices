import type { LandTypes } from './LandTypes';
import type { Micronutrients, AminoAcids } from './NutrientTypes';

export type RawFood = {
  name: string; slug: string; type: 'plant' | 'animal';
  calories: number; fat: number; protein: number; fiber: number; sat_fat: number;
  sodium: number | null; carbs: number | null; sugar: number | null;
  cholesterol: number | null; trans_fat: number | null;
  // vitamins and minerals per gram (units in data/json/SCHEMA.md); null when none are sourced
  micronutrients: Micronutrients | null;
  // the 18 amino acids in g per gram of food; null when none are sourced
  amino_acids: AminoAcids | null;
  yield_kg_ha: number | null; pasture_ha_per_kg_output: number | null;
  emissions_per_kg: number | null; water_per_kg: number | null;
  neuron_count: number; weight_kg: number | null; yield_fraction: number | null;
  lifetime_output_kg: number | null;
  // offspring killed per producing animal (dairy calves, culled male chicks)
  offspring_deaths_per_animal: number | null;
  offspring_captivity_years:   number | null;
  ch4_kg_per_kg_output: number | null;
  n2o_kg_per_kg_output: number | null;
  co2_kg_per_kg_output: number | null;
  green_water_per_kg: number | null;
  blue_water_per_kg:  number | null;
  grey_water_per_kg:  number | null;
  // PAF = potentially affected fraction: the share (0-1) of a group of species harmed by this crop's pesticides. The name is kept because it is also the database column and JSON key.
  pesticide_insect_paf:      number | null;
  pesticide_terrestrial_paf: number | null;
  pesticide_bee_hazard:      number | null;
  pesticide_kg_per_kg_food:  number | null;
  feed_water_per_kg: number | null;
  feed_emissions_per_kg: number | null;
  feed_green_water_per_kg: number | null;
  feed_blue_water_per_kg:  number | null;
  feed_grey_water_per_kg:  number | null;
  feed_pesticide_insect_paf:      number | null;
  feed_pesticide_terrestrial_paf: number | null;
  feed_pesticide_bee_hazard:      number | null;
  feed_pesticide_kg_per_kg_food:  number | null;
  feed_land_m2_per_kg:            number | null;
  // bycatch — kg of bycatch animal killed per kg of this food; null if no bycatch
  bycatch_amount:       number | null;
  bycatch_food_slug:    string | null;
  bycatch_neuron_count: number | null;
  bycatch_weight_kg:    number | null;
  // wild fish killed for fishmeal / fish oil — per kg of product, or summed over an animal's feed
  wild_fish_kg_per_kg:      number | null;
  wild_fish_neuron_count:   number | null;
  wild_fish_weight_kg:      number | null;
  wild_fish_lifespan_years: number | null;
  // global supply availability
  availability_gg: number | null;
  // plain-English tooltip text for the sentient harm columns
  sentient_harm_explanation: string | null;
  // fraction of this food's land in each land type (sums to 1); null for foods with no farmland
  land_types: LandTypes | null;
  // food group from the source JSON file (e.g. 'nuts', 'leafy'); drives the table filter buttons
  category: string | null;
  tags: string[];
};
