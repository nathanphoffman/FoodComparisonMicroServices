import { NameCell } from './Cells/NameCell';
import { NutritionScoreCell } from './Cells/NutritionScoreCell';
import { EmissionsCell } from './Cells/EmissionsCell';
import { LandUseCell } from './Cells/LandUseCell';
import { IntelligenceCell } from './Cells/IntelligenceCell';
import { WaterCell } from './Cells/WaterCell';
import { SentientHarmCell } from './Cells/SentientHarmCell';
import { CaptiveSentienceCell } from './Cells/CaptiveSentienceCell';
import { FinalScoreCell } from './Cells/FinalScoreCell';
import { RankCell } from './Cells/RankCell';
import { AvailabilityCell } from './Cells/AvailabilityCell';
import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import { toNutritionDetail, toIntelligenceDetail } from '../nutrition/FoodTableCalculations';
import type { ScoredRow } from '../scoring/FoodTableSort';
import { DIET_SLUG, EMPTY_SENTIENT_HARM_DETAIL, type ColConfig, type NutritionDetail, type RawFood, type SliderValues } from '../Types/FoodTableTypes';

/** What every cell in the table can need besides its own food. */
export type CellContext = {
    unit: string;
    sliderValues: SliderValues;
    nutrientStandard: NutrientStandard;
    dietSettings: DietSettings | null;
    /** Combined nutrition for the custom foods' tooltips, by slug. */
    customNutrition: Map<string, NutritionDetail | null>;
    ranks: Map<string, number>;
    rankedCount: number;
    onSelect: (slug: string) => void;
};

/** The cell for one column of one food's row. */
export function foodTableCell(columnKey: ColConfig['key'], food: RawFood, scoredRow: ScoredRow | undefined, context: CellContext) {
    const { unit, sliderValues, nutrientStandard, dietSettings, customNutrition, ranks, rankedCount, onSelect } = context;
    const divisor = scoredRow?.divisor ?? 1;
    const referenceWater = food.type === 'animal' ? food.feed_water_per_kg : food.water_per_kg;
    switch (columnKey) {
        case 'name':           return <NameCell           key="name"           name={food.name} slug={food.slug} onSelect={onSelect} />;
        case 'rank':           return <RankCell           key="rank"           rank={ranks.get(food.slug) ?? null} total={rankedCount} />;
        case 'nutritionScore': return <NutritionScoreCell key="nutritionScore" score={scoredRow?.nutrition_score ?? null} detail={customNutrition.get(food.slug) ?? toNutritionDetail(food)} diet={food.slug === DIET_SLUG ? dietSettings : null} standard={nutrientStandard} />;
        case 'emissions':      return <EmissionsCell      key="emissions"      value={scoredRow?.emissions ?? null} breakdown={scoredRow?.emissions_breakdown} divisor={divisor} />;
        case 'landUse':        return <LandUseCell        key="landUse"        value={scoredRow?.land_use ?? null} detail={scoredRow?.land_use_detail ?? { type: food.type, yieldKilogramsPerHectare: null, pastureHectaresPerKilogram: null, feedLandM2PerKg: null, rawM2PerKg: 0, landTypes: null, multiplier: 1 }} divisor={divisor} unit={unit} />;
        case 'directKill':     return <IntelligenceCell   key="directKill"     value={scoredRow?.direct_kill ?? null} detail={toIntelligenceDetail(food)} killDetail={scoredRow?.kill_detail} wildFishDeathsPerKg={scoredRow?.wild_fish_deaths_per_kg} explanation={food.sentient_harm_explanation} />;
        case 'water':          return <WaterCell          key="water"          value={scoredRow?.water ?? null} detail={scoredRow?.water_detail} referenceTotal={referenceWater} divisor={divisor} unit={unit} greenWaterWeight={sliderValues.greenWaterWeight} greyWaterWeight={sliderValues.greyWaterWeight} />;
        case 'captiveSentience': return <CaptiveSentienceCell key="captiveSentience" value={scoredRow?.captive_sentience ?? null} killDetail={scoredRow?.kill_detail} captivityMultiplier={sliderValues.captivityMultiplier} explanation={food.sentient_harm_explanation} />;
        case 'sentientHarm':   return <SentientHarmCell   key="sentientHarm"   value={scoredRow?.sentient_harm ?? null} detail={scoredRow?.sentient_harm_detail ?? EMPTY_SENTIENT_HARM_DETAIL} divisor={divisor} killMultiplier={sliderValues.killMultiplier} explanation={food.sentient_harm_explanation} />;
        case 'finalScore':     return <FinalScoreCell     key="finalScore"     ratio={scoredRow?.final_score ?? null} />;
        case 'availability':   return <AvailabilityCell   key="availability"   value={scoredRow?.availability ?? null} />;
    }
}
