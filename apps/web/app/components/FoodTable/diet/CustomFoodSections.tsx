import { CustomFoodBuilder, type DietOptions } from './CustomFoodBuilder';
import { CUSTOM_FOODS, DIET_SLUG, type CustomFoodInput } from '../types/FoodTableTypes';

type Props = {
    foods: { slug: string; name: string; calories?: number }[];
    /** How the whole-diet builder behaves; the other custom foods don't get it. */
    diet: DietOptions;
    onCustomFoodChange: (food: CustomFoodInput) => void;
};

/** One builder per custom food (the diet), each under its own heading. */
export function CustomFoodSections({ foods, diet, onCustomFoodChange }: Props) {
    return (
        <>
            {CUSTOM_FOODS.map(custom => (
                <div key={custom.slug} className="mb-4 px-1">
                    <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">{custom.heading}</p>
                    <CustomFoodBuilder
                        custom={custom}
                        foods={foods}
                        diet={custom.slug === DIET_SLUG ? diet : undefined}
                        onChange={onCustomFoodChange}
                    />
                </div>
            ))}
        </>
    );
}
