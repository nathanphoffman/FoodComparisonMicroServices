import type { RawFood, LandTypes, NutritionWeights, CustomFoodInput, SliderValues } from './FoodTableTypes';

// Field names must match #[serde(rename_all = "camelCase")] on the Rust SliderQuery struct.
export type SliderQuery = {
    calorieWeight:              number;
    proteinWeight:              number;
    dryMassWeight:              number;
    wetMassWeight:              number;
    greenWater:                 number;
    greyWater:                  number;
    killMultiplier:             number;
    captivityMultiplier:        number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
    zeroBetterMultiplier:       number;
    referenceSlug:              string | null;
    customFoods:                CustomFoodInput[];
    nutritionPriority:          number;
    emissionsPriority:          number;
    intelligencePriority:       number;
    waterPriority:              number;
    landUsePriority:            number;
    availabilityPriority:       number;
    landTypeWeights:            LandTypes;
    nutritionWeights:           NutritionWeights;
    winDampening:               number;
    overHuntingFactor:          number;
    overGatheringFactor:        number;
};

// Single input object passed to WASM — keeps the boundary simple and
// prevents the call site from growing as new inputs are added.
export type ScoreInput = {
    foods: RawFood[];
    query: SliderQuery;
};


/** The slider values and custom foods in the shape the WASM scorer takes. */
export function buildScoreInput(foods: RawFood[], sliderValues: SliderValues, customFoods: CustomFoodInput[]): ScoreInput {
    const { weights, scorePriorities, greenWaterWeight, greyWaterWeight } = sliderValues;
    return {
        foods,
        query: {
            calorieWeight:        weights.calories,
            proteinWeight:        weights.protein,
            dryMassWeight:        weights.dryMass,
            wetMassWeight:        weights.wetMass,
            greenWater:           greenWaterWeight,
            greyWater:            greyWaterWeight,
            nutritionPriority:    scorePriorities.nutrition,
            emissionsPriority:    scorePriorities.emissions,
            intelligencePriority: scorePriorities.intelligence,
            waterPriority:        scorePriorities.water,
            landUsePriority:      scorePriorities.landUse,
            availabilityPriority: scorePriorities.availability,
            customFoods,
            // These are named the same in the slider values and the query.
            killMultiplier:            sliderValues.killMultiplier,
            captivityMultiplier:       sliderValues.captivityMultiplier,
            neuronExponent:            sliderValues.neuronExponent,
            weightExponent:            sliderValues.weightExponent,
            finalIntelligenceExponent: sliderValues.finalIntelligenceExponent,
            zeroBetterMultiplier:      sliderValues.zeroBetterMultiplier,
            referenceSlug:             sliderValues.referenceSlug,
            landTypeWeights:           sliderValues.landTypeWeights,
            nutritionWeights:          sliderValues.nutritionWeights,
            winDampening:              sliderValues.winDampening,
            overHuntingFactor:         sliderValues.overHuntingFactor,
            overGatheringFactor:       sliderValues.overGatheringFactor,
        },
    };
}
