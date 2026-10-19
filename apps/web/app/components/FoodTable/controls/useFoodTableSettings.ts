import { useMemo, useState } from 'react';
import { DEFAULT_NUTRIENT_STANDARD, type NutrientStandard } from '../nutrition/FoodTableRda';
import type { ColConfig, DataRegion, SliderValues } from '../types/FoodTableTypes';
import { COLUMN_CONFIG, DEFAULT_DATA_REGION, DEFAULT_SLIDER_VALUES } from '../scoring/FoodTableDefaults';
import { DEFAULT_FOOD_FILTER } from './toolbar/FoodTableFilters';

/** What the person has chosen for the table: sliders, region, daily needs, food filter and visible columns. */
export function useFoodTableSettings() {
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

  return { sliderValues, setSliderValues, dataRegion, dataSettings, nutrientStandard, foodFilter, setFoodFilter, activeCols, setActiveCols };
}
