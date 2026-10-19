import { CustomFoodBuilder } from './CustomFoodBuilder';
import { CUSTOM_FOODS, type CustomFoodInput } from './FoodTableTypes';
import type { DietSettings, NutrientStandard } from './FoodTableRda';

type Props = {
    foods: { slug: string; name: string; calories?: number }[];
    nutrientStandard: NutrientStandard;
    onShowDiet: () => void;
    onDietSettingsChange: (settings: DietSettings) => void;
    onCustomFoodChange: (food: CustomFoodInput) => void;
};

/** One builder per custom food (the diet), each under its own heading. */
export function CustomFoodSections({ foods, nutrientStandard, onShowDiet, onDietSettingsChange, onCustomFoodChange }: Props) {
    return (
        <>
            {CUSTOM_FOODS.map(custom => (
                <div key={custom.slug} className="mb-4 px-1">
                    <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">{custom.heading}</p>
                    <CustomFoodBuilder
                        slug={custom.slug}
                        name={custom.name}
                        storageKey={custom.storageKey}
                        foods={foods}
                        standard={nutrientStandard}
                        showCalories={custom.slug === 'your-diet'}
                        onShow={onShowDiet}
                        onSettingsChange={onDietSettingsChange}
                        onChange={onCustomFoodChange}
                    />
                </div>
            ))}
        </>
    );
}
