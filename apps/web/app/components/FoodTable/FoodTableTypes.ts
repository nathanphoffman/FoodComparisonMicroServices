export type FoodWeights = {
    calories: number;
    protein:  number;
    mass:     number;
};

export type EmissionsBreakdown = {
    co2:           number;
    ch4:           number;
    n2o:           number;
    feedEmissions?: number;
};

export type WaterDetail = {
    green: number | null;
    blue:  number | null;
    grey:  number | null;
};

export type LandUseDetail = {
    type:                        'plant' | 'animal';
    yieldKilogramsPerHectare:    number | null;
    pastureHectaresPerKilogram:  number | null;
    feedLandM2PerKg:             number | null;
};

export type NutritionDetail = {
    calories:     number;
    fat:          number;
    saturatedFat: number;
    transFat:     number | null;
    cholesterol:  number | null;
    sodium:       number | null;
    carbs:        number | null;
    fiber:        number;
    sugar:        number | null;
    protein:      number;
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

export const EMPTY_ECO_DETAIL: EcoDestructionDetail = {
    insectScore: 0, beeScore: 0, wormScore: 0, deforestationScore: 0,
    feedInsectScore: 0, feedBeeScore: 0, feedWormScore: 0,
    feedDeforestationScore: 0, pastureDeforestationScore: 0, bycatchScore: 0,
};
