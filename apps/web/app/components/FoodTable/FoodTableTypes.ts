export type EmissionsBreakdown = { co2: number; ch4: number; n2o: number; feedEmissions?: number };

export type FoodWeights = {
    calories: number;
    protein:  number;
    mass:     number;
};

export type WaterDetail = {
    green: number | null;
    blue:  number | null;
    grey:  number | null;
};

export type FoodEthics = {
  name:                  string;
  slug:                  string;
  nutritionScore:        number | null;
  nutritionDetail:       NutritionDetail;
  emissions:             number | null;
  emissionsBreakdown?:   EmissionsBreakdown;
  landUse:               number | null;
  landUseDetail:         LandUseDetail;
  intelligence:          number | null;
  intelligenceDetail:    IntelligenceDetail;
  water:                 number | null;
  waterDetail:           WaterDetail;
  ecoDestruction:        number | null;
  ecoDestructionDetail:  EcoDestructionDetail;
};

export type NutritionDetail = {
  calories:      number;
  fat:           number;
  saturatedFat:  number;
  transFat:      number | null;
  cholesterol:   number | null;
  sodium:        number | null;
  carbs:         number | null;
  fiber:         number;
  sugar:         number | null;
  protein:       number;
};

export type LandUseDetail = {
  type:                       'plant' | 'animal';
  yieldKilogramsPerHectare:   number | null;
  pastureHectaresPerKilogram: number | null;
  feedLandM2PerKg:            number | null;
};

export type IntelligenceDetail = {
  neuronCount:   number;
  weightKg:      number | null;
  yieldFraction: number | null;
};

export type EcoDestructionDetail = {
    insectScore:               number;
    beeScore:                  number;
    wormScore:                 number;
    deforestationScore:        number;
    feedInsectScore:           number;
    feedBeeScore:              number;
    feedWormScore:             number;
    feedDeforestationScore:    number;
    pastureDeforestationScore: number;
    bycatchScore:              number;
};
