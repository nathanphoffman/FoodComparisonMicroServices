import { DietBuilder, type DietOptions } from './DietBuilder/DietBuilder';
import { DIET, type DietInput } from '../types/FoodTableTypes';

type Props = {
    foods: { slug: string; name: string; calories?: number }[];
    options: DietOptions;
    onDietChange: (diet: DietInput) => void;
};

/** The diet builder under its heading. */
export function DietSection({ foods, options, onDietChange }: Props) {
    return (
        <div className="mb-4 px-1">
            <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">{DIET.heading}</p>
            <DietBuilder foods={foods} options={options} onChange={onDietChange} />
        </div>
    );
}
