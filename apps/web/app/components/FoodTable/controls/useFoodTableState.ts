import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_NUTRIENT_STANDARD, type DietSettings, type NutrientStandard } from '../nutrition/FoodTableRda';
import type { ColConfig, DataRegion, SliderValues } from '../types/FoodTableTypes';
import { COLUMN_CONFIG, DEFAULT_DATA_REGION, DEFAULT_SLIDER_VALUES } from '../scoring/FoodTableDefaults';
import { DEFAULT_FOOD_FILTER } from './toolbar/FoodTableFilters';

/** What the person has chosen for the table (sliders, region, daily needs, food filter, columns) and which windows are open. */
export function useFoodTableState() {
  const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
  const [dataRegion, setDataRegion] = useState<DataRegion>(DEFAULT_DATA_REGION);

  // Whose recommended intakes the tooltips measure vitamins and minerals against
  const [nutrientStandard, setNutrientStandard] = useState<NutrientStandard>(DEFAULT_NUTRIENT_STANDARD);
  const [foodFilter, setFoodFilter] = useState<string>(DEFAULT_FOOD_FILTER);

  // Updated synchronously by FoodTableInputs
  const [activeCols, setActiveCols] = useState<ColConfig[]>(() => COLUMN_CONFIG.filter(column => column.defaultVisible));

  // Memoized so the (memoized) inputs only re-render when the region or standard changes.
  const dataSettings = useMemo(
    () => ({ dataRegion, onDataRegionChange: setDataRegion, nutrientStandard, onNutrientStandardChange: setNutrientStandard }),
    [dataRegion, nutrientStandard],
  );

  // Food whose detail window is open (null = closed)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const closeDetail = useCallback(() => setSelectedSlug(null), []);
  const [showDiet, setShowDiet] = useState(false);
  const closeDiet = useCallback(() => setShowDiet(false), []);
  const openDiet = useCallback(() => setShowDiet(true), []);

  // The diet's total calories per day, size and activity, for the whole-diet numbers in its tooltip
  const [dietSettings, setDietSettings] = useState<DietSettings | null>(null);

  return {
    sliderValues, setSliderValues, dataRegion, dataSettings, nutrientStandard, foodFilter, setFoodFilter, activeCols, setActiveCols,
    selectedSlug, setSelectedSlug, closeDetail, showDiet, openDiet, closeDiet, dietSettings, setDietSettings,
  };
}
