import { Slider } from '../../../../Inputs/Slider';
import { DAYS_PER_WEEK, FINE_MAX_PERCENT, FINE_STEP_PERCENT, LEVEL_STEP, MAX_LEVEL, formatPercent, type Ingredient } from '../logic/CustomFoodSaved';

const formatCalories = (kcal: number) => Math.round(kcal).toLocaleString();

type Props = {
    ingredients: Ingredient[];
    /** Each ingredient's percentage of the whole, in the same order. */
    percents: number[];
    /** Shows each ingredient's calories per day and week, when this returns a number for it. */
    caloriesPerDay: (slug: string) => number | null;
    showCalories?: boolean;
    onSlide: (index: number, value: number) => void;
    onFineChange: (index: number, fine: boolean) => void;
    onRemove: (slug: string) => void;
};

/** One slider per ingredient, with its percentage, a fine-control toggle and a remove button. */
export function IngredientList({ ingredients, percents, caloriesPerDay, showCalories, onSlide, onFineChange, onRemove }: Props) {
    return (
        <div className="flex flex-col gap-1.5 pt-1">
            {ingredients.map((ing, idx) => {
                const kcal = showCalories ? caloriesPerDay(ing.slug) : null;
                return (
                    <div key={ing.slug}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-600 w-20 md:w-28 truncate shrink-0">{ing.name}</span>
                            <span className="text-xs text-neutral-500 w-12 text-right shrink-0">
                                {formatPercent(percents[idx])}
                            </span>
                            <div className="flex-1 min-w-0">
                                <Slider
                                    min={0}
                                    max={ing.fine ? FINE_MAX_PERCENT : MAX_LEVEL}
                                    step={ing.fine ? FINE_STEP_PERCENT : LEVEL_STEP}
                                    value={ing.fine ? Math.min(percents[idx], FINE_MAX_PERCENT) : ing.level}
                                    onChange={value => onSlide(idx, value)}
                                />
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                    <span>Least</span>
                                    <span>{ing.fine ? `${FINE_MAX_PERCENT}%` : 'Most'}</span>
                                </div>
                            </div>
                            <label className="flex items-center gap-1 text-[10px] text-neutral-500 shrink-0 cursor-pointer" title="Fine control: the slider sets this food's share directly from 0 to 1% in 0.005% steps">
                                <input type="checkbox" checked={!!ing.fine} onChange={e => onFineChange(idx, e.target.checked)} />
                                ÷100
                            </label>
                            <button
                                onClick={() => onRemove(ing.slug)}
                                className="text-neutral-400 hover:text-red-500 text-xs shrink-0 leading-none"
                                aria-label={`Remove ${ing.name}`}
                            >✕</button>
                        </div>
                        {kcal !== null && (
                            <p className="text-[10px] text-neutral-500 pl-[5.5rem] md:pl-[8rem]">
                                {formatCalories(kcal)} kcal / day · {formatCalories(kcal * DAYS_PER_WEEK)} kcal / week
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
