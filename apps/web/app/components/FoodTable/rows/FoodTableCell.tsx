import { NameCell } from './Cells/NameCell';
import { NutritionScoreCell } from './Cells/score/NutritionScoreCell';
import { EmissionsCell } from './Cells/environment/EmissionsCell';
import { LandUseCell } from './Cells/environment/LandUseCell';
import { DirectKillCell } from './Cells/harm/DirectKillCell';
import { WaterCell } from './Cells/environment/WaterCell';
import { SentientHarmCell } from './Cells/harm/SentientHarmCell';
import { CaptiveSentienceCell } from './Cells/harm/CaptiveSentienceCell';
import { FinalScoreCell } from './Cells/score/FinalScoreCell';
import { RankCell } from './Cells/score/RankCell';
import { AvailabilityCell } from './Cells/score/AvailabilityCell';
import type { DietSettings, NutrientStandard } from '../nutrition/FoodTableRda';
import { toNutritionDetail, toIntelligenceDetail } from '../nutrition/FoodTableCalculations';
import type { ScoredRow } from '../types/FoodTableTypes';
import { isDietSlug, EMPTY_SENTIENT_HARM_DETAIL, type ColConfig, type NutritionDetail, type RawFood, type SliderValues } from '../types/FoodTableTypes';

/** What every cell in the table can need besides its own food. */
export type CellContext = {
    unit: string;
    sliderValues: SliderValues;
    nutrientStandard: NutrientStandard;
    dietSettings: DietSettings | null;
    /** The diet's combined nutrition, for its tooltip. */
    dietNutrition: NutritionDetail | null;
    ranks: Map<string, number>;
    rankedCount: number;
    onSelect: (slug: string) => void;
};

/** The cell for one column of one food's row. */
export function foodTableCell(columnKey: ColConfig['key'], food: RawFood, scoredRow: ScoredRow | undefined, context: CellContext) {
    const { unit, sliderValues, nutrientStandard, dietSettings, dietNutrition, ranks, rankedCount, onSelect } = context;
    const divisor = scoredRow?.divisor ?? 1;
    const referenceWater = food.type === 'animal' ? food.feed_water_per_kg : food.water_per_kg;
    switch (columnKey) {
        case 'name':           return <NameCell           key="name"           name={food.name} slug={food.slug} onSelect={onSelect} />;
        case 'rank':           return <RankCell           key="rank"           rank={ranks.get(food.slug) ?? null} total={rankedCount} />;
        case 'nutritionScore': return <NutritionScoreCell key="nutritionScore" score={scoredRow?.nutritionScore ?? null} detail={(isDietSlug(food.slug) ? dietNutrition : null) ?? toNutritionDetail(food)} diet={isDietSlug(food.slug) ? dietSettings : null} standard={nutrientStandard} />;
        case 'emissions':      return <EmissionsCell      key="emissions"      value={scoredRow?.emissions ?? null} breakdown={scoredRow?.emissionsBreakdown} divisor={divisor} />;
        case 'landUse':        return <LandUseCell        key="landUse"        value={scoredRow?.landUse ?? null} detail={scoredRow?.landUseDetail ?? { type: food.type, yieldKilogramsPerHectare: null, pastureHectaresPerKilogram: null, feedLandM2PerKg: null, rawM2PerKg: 0, landTypes: null, multiplier: 1 }} divisor={divisor} unit={unit} />;
        case 'directKill':     return <DirectKillCell   key="directKill"     value={scoredRow?.directKill ?? null} detail={toIntelligenceDetail(food)} killDetail={scoredRow?.killDetail} wildFishDeathsPerKg={scoredRow?.wildFishDeathsPerKg} explanation={food.sentient_harm_explanation} />;
        case 'water':          return <WaterCell          key="water"          value={scoredRow?.water ?? null} detail={scoredRow?.waterDetail} referenceTotal={referenceWater} divisor={divisor} unit={unit} greenWaterWeight={sliderValues.greenWaterWeight} greyWaterWeight={sliderValues.greyWaterWeight} />;
        case 'captiveSentience': return <CaptiveSentienceCell key="captiveSentience" value={scoredRow?.captiveSentience ?? null} killDetail={scoredRow?.killDetail} captivityMultiplier={sliderValues.captivityMultiplier} explanation={food.sentient_harm_explanation} />;
        case 'sentientHarm':   return <SentientHarmCell   key="sentientHarm"   value={scoredRow?.sentientHarm ?? null} detail={scoredRow?.sentientHarmDetail ?? EMPTY_SENTIENT_HARM_DETAIL} divisor={divisor} killMultiplier={sliderValues.killMultiplier} explanation={food.sentient_harm_explanation} />;
        case 'finalScore':     return <FinalScoreCell     key="finalScore"     ratio={scoredRow?.finalScore ?? null} />;
        case 'availability':   return <AvailabilityCell   key="availability"   value={scoredRow?.availability ?? null} />;
    }
}
