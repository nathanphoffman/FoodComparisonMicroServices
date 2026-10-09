'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table } from '../Table/Table';
import { Row } from '../Table/Row';
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
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from './FoodTableRda';
import { getUnitLabel, toNutritionDetail, blendNutritionDetail, blendLandM2PerKg, toIntelligenceDetail } from './FoodTableCalculations';
import type { RawFood } from './FoodTableTypes';
import { useFoodTableSort } from './FoodTableSort';
import { loadWasm, useWasmScoring } from './FoodTableWASMIntegration';
import { FoodTableInputs } from './FoodTableInputs';
import { COLUMN_CONFIG, DEFAULT_SLIDER_VALUES, DEFAULT_DATA_REGION } from './FoodTableDefaults';
import type { ColConfig, SliderValues, DataRegion } from './FoodTableTypes';
import type { CustomFoodInput } from './FoodTableTypes';
import { EMPTY_SENTIENT_HARM_DETAIL, CUSTOM_FOODS, customFoodStub, isCustomFoodSlug } from './FoodTableTypes';
import { FoodTableFilters, DEFAULT_FOOD_FILTER, matchesFoodFilter } from './FoodTableFilters';
import { Modal } from '../Modals/Modal';
import { DietExplainer } from './DietExplainer';
import { DietImpact } from './DietImpact';
import { AVERAGE_DIET_SLUG, averageDietInput } from './FoodTableAverageDiet';
import { NutritionDetailContent } from './Tooltips/NutritionTooltip';
import { FoodDetailModal } from './FoodDetail/FoodDetailModal';
import type { FigureKey } from './FoodDetail/FoodDetailFigures';

// ── Component ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050';

export function FoodTable() {
    // Data state
    const [rawFoods, setRawFoods] = useState<RawFood[]>([]);
    const [loadingApi,  setLoadingApi]  = useState(true);
    const [loadingScore,  setLoadingScore]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);

    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [dataRegion, setDataRegion] = useState<DataRegion>(DEFAULT_DATA_REGION);
    const [foodFilter, setFoodFilter] = useState<string>(DEFAULT_FOOD_FILTER);
    // Food whose detail modal is open (null = closed)
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const closeDetail = useCallback(() => setSelectedSlug(null), []);

    // Custom meal / diet, keyed by slug so each builder can report on its own
    const [customFoodsBySlug, setCustomFoodsBySlug] = useState<Record<string, CustomFoodInput>>({});
    const customFoods = useMemo(() => Object.values(customFoodsBySlug), [customFoodsBySlug]);
    const handleCustomFoodChange = useCallback(
        (food: CustomFoodInput) => setCustomFoodsBySlug(previous => ({ ...previous, [food.slug]: food })),
        [],
    );

    // Whose recommended intakes the tooltips measure vitamins and minerals against
    const [nutrientStandard, setNutrientStandard] = useState<NutrientStandard>(DEFAULT_NUTRIENT_STANDARD);
    const foodSlugs = useMemo(() => new Set(rawFoods.map(food => food.slug)), [rawFoods]);
    const [showDiet, setShowDiet] = useState(false);
    const closeDiet = useCallback(() => setShowDiet(false), []);
    // The diet's total calories per day, size and activity, for the whole-diet numbers in its tooltip
    const [dietSettings, setDietSettings] = useState<DietSettings | null>(null);

    // The hidden benchmark diet is scored alongside the user's, but never shown as a table row
    const averageDiet = useMemo(() => foodSlugs.size > 0 ? averageDietInput(foodSlugs) : null, [foodSlugs]);
    const scoredCustomFoods = useMemo(() => averageDiet ? [...customFoods, averageDiet] : customFoods, [customFoods, averageDiet]);

    // Combined nutrition for the custom foods' tooltips
    const customNutrition = useMemo(() => new Map(
        customFoods.map(custom => [custom.slug, blendNutritionDetail(custom, rawFoods)]),
    ), [customFoods, rawFoods]);

    // WASM scoring — scored rows contain all scores, breakdowns, and divisors
    const { scored, scoringError, setScoringError } = useWasmScoring(rawFoods, sliderValues, scoredCustomFoods);
    const dismissScoringError = useCallback(() => setScoringError(null), [setScoringError]);

    // Sort state
    const { columnSortProps, sortRows } = useFoodTableSort();

    // UI state — activeCols updated synchronously by FoodTableInputs
    const [activeCols, setActiveCols] = useState<ColConfig[]>(
        () => COLUMN_CONFIG.filter(column => column.defaultVisible)
    );

    // ── Fetch raw foods from C# API on mount and whenever the data region changes ──

    useEffect(()=>{
        if (scored && scored.size) setLoadingScore(false);
    },[scored]);

    useEffect(() => {
        let cancelled = false;
        async function fetchFoods() {
            try {
                await loadWasm();
                const response = await fetch(`${API_URL}/api/foods?region=${dataRegion}`);
                if (!response.ok) throw new Error(`API error ${response.status}`);
                const foods: RawFood[] = await response.json();
                if (cancelled) return;
                setRawFoods(foods);
            } catch (fetchError) {
                if (!cancelled) setError(String(fetchError));
            } finally {
                if (!cancelled) setLoadingApi(false);
            }
        }
        fetchFoods();
        return () => { cancelled = true; };
    }, [dataRegion]);

    // ── Sort rows using WASM-scored values ────────────────────────────────────

    // Filtering only hides rows; every food is still scored so scores don't shift
    // with the filter. Custom meal / diet rows always stay visible.
    const displayRows = useMemo(() => {
        const visibleFoods = rawFoods.filter(food => matchesFoodFilter(food, foodFilter));
        const customRows = CUSTOM_FOODS.filter(custom => scored.has(custom.slug)).map(custom => customFoodStub(custom.slug, custom.name));
        const foodsToSort = [...visibleFoods, ...customRows];
        return sortRows(foodsToSort, scored);
    }, [rawFoods, foodFilter, scored, sortRows]);

    // Rank by Improvement (1 = best) among the rows on screen, whatever the table is sorted by.
    // Rows without an Improvement score get no rank; tied scores share a rank.
    const { ranks, rankedCount } = useMemo(() => {
        const scores = displayRows.flatMap(food => {
            const score = scored.get(food.slug)?.final_score;
            return score == null ? [] : [{ slug: food.slug, score }];
        });
        const ranks = new Map(scores.map(({ slug, score }) => [slug, 1 + scores.filter(other => other.score > score).length]));
        return { ranks, rankedCount: scores.length };
    }, [displayRows, scored]);

    // ── Render ────────────────────────────────────────────────────────────────

    const { weights, greenWaterWeight, greyWaterWeight } = sliderValues;
    const unit = getUnitLabel(weights);

    // Memoized so opening/closing the detail modal (or other unrelated state changes)
    // doesn't re-render every row and its tooltips.
    const tableRows = useMemo(() => (
        displayRows.map(food => {
            const scoredRow = scored.get(food.slug);
            const referenceWater = food.type === 'animal' ? food.feed_water_per_kg : food.water_per_kg;
            return (
                <Row key={food.slug} className={isCustomFoodSlug(food.slug) ? 'bg-yellow-50' : undefined}>
                    {activeCols.map(column => {
                        switch (column.key) {
                            case 'name':           return <NameCell           key="name"           name={food.name} slug={food.slug} onSelect={setSelectedSlug} />;
                            case 'rank':           return <RankCell           key="rank"           rank={ranks.get(food.slug) ?? null} total={rankedCount} />;
                            case 'nutritionScore': return <NutritionScoreCell key="nutritionScore" score={scoredRow?.nutrition_score ?? null} detail={customNutrition.get(food.slug) ?? toNutritionDetail(food)} diet={food.slug === 'your-diet' ? dietSettings : null} standard={nutrientStandard} />;
                            case 'emissions':      return <EmissionsCell      key="emissions"      value={scoredRow?.emissions ?? null} breakdown={scoredRow?.emissions_breakdown} divisor={scoredRow?.divisor ?? 1} />;
                            case 'landUse':        return <LandUseCell        key="landUse"        value={scoredRow?.land_use ?? null} detail={scoredRow?.land_use_detail ?? { type: food.type, yieldKilogramsPerHectare: null, pastureHectaresPerKilogram: null, feedLandM2PerKg: null, rawM2PerKg: 0, landTypes: null, multiplier: 1 }} divisor={scoredRow?.divisor ?? 1} unit={unit} />;
                            case 'directKill':     return <IntelligenceCell   key="directKill"     value={scoredRow?.direct_kill ?? null} detail={toIntelligenceDetail(food)} killDetail={scoredRow?.kill_detail} wildFishDeathsPerKg={scoredRow?.wild_fish_deaths_per_kg} explanation={food.sentient_harm_explanation} />;
                            case 'water':          return <WaterCell          key="water"          value={scoredRow?.water ?? null} detail={scoredRow?.water_detail} referenceTotal={referenceWater} divisor={scoredRow?.divisor ?? 1} unit={unit} greenWaterWeight={greenWaterWeight} greyWaterWeight={greyWaterWeight} />;
                            case 'captiveSentience': return <CaptiveSentienceCell key="captiveSentience" value={scoredRow?.captive_sentience ?? null} killDetail={scoredRow?.kill_detail} captivityMultiplier={sliderValues.captivityMultiplier} explanation={food.sentient_harm_explanation} />;
                            case 'sentientHarm':   return <SentientHarmCell   key="sentientHarm"   value={scoredRow?.sentient_harm ?? null} detail={scoredRow?.sentient_harm_detail ?? EMPTY_SENTIENT_HARM_DETAIL} divisor={scoredRow?.divisor ?? 1} killMultiplier={sliderValues.killMultiplier} explanation={food.sentient_harm_explanation} />;
                            case 'finalScore':     return <FinalScoreCell     key="finalScore"     ratio={scoredRow?.final_score ?? null} />;
                            case 'availability':   return <AvailabilityCell   key="availability"   value={scoredRow?.availability ?? null} />;
                        }
                    })}
                </Row>
            );
        })
    ), [displayRows, scored, ranks, rankedCount, customNutrition, dietSettings, nutrientStandard, activeCols, sliderValues, unit, greenWaterWeight, greyWaterWeight]);
    const referenceName = rawFoods.find(f => f.slug === sliderValues.referenceSlug)?.name ?? sliderValues.referenceSlug;
    const DYNAMIC_LABELS: Partial<Record<ColConfig['key'], string>> = {
        emissions:    `CO₂e (kg / ${unit})`,
        landUse:      `Land Use (m² / ${unit})`,
        directKill:   `Direct Kill / ${unit}`,
        water:        `Water (L / ${unit})`,
        captiveSentience: `Captive Sentience Cost / ${unit}`,
        sentientHarm: `Sentient Harm / ${unit}`,
        finalScore:   `Improvement over ${referenceName}`,
    };

    // Every column's label, for the detail modal's tiles (it shows all figures, not only visible columns)
    const figureLabels = Object.fromEntries(
        COLUMN_CONFIG.filter(column => column.key !== 'name' && column.key !== 'rank').map(column => [column.key, DYNAMIC_LABELS[column.key] ?? column.label]),
    ) as Record<FigureKey, string>;
    const selectedFood = selectedSlug ? rawFoods.find(food => food.slug === selectedSlug) : undefined;

    const headers = activeCols.map(column => ({
        label: DYNAMIC_LABELS[column.key] ?? column.label,
        // Rank follows the Improvement score, so it isn't a sort column of its own.
        ...(column.key === 'rank' ? {} : columnSortProps(column.key)),
    }));

    if (error)   return <p className="mt-6 text-red-600">Failed to load data: {error}</p>;
    if (loadingApi || loadingScore) return <p className="mt-6 text-neutral-500">Loading food data…</p>;

    return (
        <div className="mt-6">
            <FoodTableInputs
                onSliderValuesChange={setSliderValues}
                onCustomFoodChange={handleCustomFoodChange}
                onDietSettingsChange={setDietSettings}
                onShowDiet={() => setShowDiet(true)}
                scoringError={scoringError}
                onDismissScoringError={dismissScoringError}
                onActiveColsChange={setActiveCols}
                foods={rawFoods}
                dataRegion={dataRegion}
                onDataRegionChange={setDataRegion}
                nutrientStandard={nutrientStandard}
                onNutrientStandardChange={setNutrientStandard}
            />

            <FoodTableFilters selected={foodFilter} onChange={setFoodFilter} />

            <Table headers={headers}>
                {tableRows}
            </Table>

            {showDiet && customNutrition.get('your-diet') && (
                <Modal title="Your Diet" onClose={closeDiet} wide>
                    <div className="bg-neutral-900 text-neutral-100 text-xs rounded-lg px-3 py-2.5 md:whitespace-nowrap">
                        <NutritionDetailContent detail={customNutrition.get('your-diet')!} diet={dietSettings} standard={nutrientStandard} />
                    </div>
                    {scored.get('your-diet') && (
                        <DietImpact
                            row={scored.get('your-diet')!}
                            scored={scored}
                            foodSlugs={foodSlugs}
                            unit={unit}
                            dailyCalories={dietSettings?.calories ?? null}
                            caloriesPerGram={customNutrition.get('your-diet')?.calories ?? null}
                            benchmark={scored.get(AVERAGE_DIET_SLUG) ?? null}
                            benchmarkRawLandM2PerKg={averageDiet ? blendLandM2PerKg(averageDiet, rawFoods, slug => scored.get(slug)?.land_use_detail.rawM2PerKg) : null}
                            rawLandM2PerKg={customFoodsBySlug['your-diet'] ? blendLandM2PerKg(customFoodsBySlug['your-diet'], rawFoods, slug => scored.get(slug)?.land_use_detail.rawM2PerKg) : null}
                        />
                    )}
                    <DietExplainer />
                </Modal>
            )}

            {selectedFood && (
                <FoodDetailModal
                    food={selectedFood}
                    scoredRow={scored.get(selectedFood.slug)}
                    labels={figureLabels}
                    mathContext={{
                        sliders: sliderValues,
                        unit,
                        referenceRow: scored.get(sliderValues.referenceSlug),
                        referenceName,
                        figureLabels,
                    }}
                    onClose={closeDetail}
                />
            )}
        </div>
    );
}
