import type { SliderValues } from "../../../types/FoodTableTypes";
import { IntelligenceExamples } from "../IntelligenceExamples";
import { ValueSlider } from "./ValueSlider";
import * as SLIDERS from "./ValueSliderSettings";

type GroupProps = {
    values: SliderValues;
    onChange: <SliderKey extends keyof SliderValues>(key: SliderKey, value: SliderValues[SliderKey]) => void;
    /** Changing it remounts the sliders so they pick up `values` again (used by presets). */
    resetKey: number;
};

/** The sliders behind the intelligence score and the kill, captivity and accident weights, with worked examples. */
export function IntelligenceSliders({ values, onChange, resetKey }: GroupProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            <IntelligenceExamples
                neuronExponent={values.neuronExponent}
                weightExponent={values.weightExponent}
                finalIntelligenceExponent={values.finalIntelligenceExponent}
            />
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <ValueSlider key={`NEURON_EXPONENT-${resetKey}`} {...SLIDERS.NEURON_EXPONENT} initialValue={values.neuronExponent} onChange={value => onChange('neuronExponent', value)} />
                <ValueSlider key={`WEIGHT_EXPONENT-${resetKey}`} {...SLIDERS.WEIGHT_EXPONENT} initialValue={values.weightExponent} onChange={value => onChange('weightExponent', value)} />
                <ValueSlider key={`FINAL_INTELLIGENCE_EXPONENT-${resetKey}`} {...SLIDERS.FINAL_INTELLIGENCE_EXPONENT} initialValue={values.finalIntelligenceExponent} onChange={value => onChange('finalIntelligenceExponent', value)} />
                <ValueSlider key={`PHILOSOPHICAL_KILL-${resetKey}`} {...SLIDERS.PHILOSOPHICAL_KILL} initialValue={values.killMultiplier} onChange={value => onChange('killMultiplier', value)} />
                <ValueSlider key={`CAPTIVITY-${resetKey}`} {...SLIDERS.CAPTIVITY} initialValue={values.captivityMultiplier} onChange={value => onChange('captivityMultiplier', value)} />
            </div>
        </div>
    );
}

/** How much grey (pollution) and green (rain) water count toward the water score. */
export function WaterSliders({ values, onChange, resetKey }: GroupProps) {
    return (
        <>
            <ValueSlider key={`GREY_WATER-${resetKey}`} {...SLIDERS.GREY_WATER} initialValue={values.greyWaterWeight} onChange={value => onChange('greyWaterWeight', value)} />
            <ValueSlider key={`GREEN_WATER-${resetKey}`} {...SLIDERS.GREEN_WATER} initialValue={values.greenWaterWeight} onChange={value => onChange('greenWaterWeight', value)} />
        </>
    );
}

/** The judgement calls: how big wins are dampened, how wild-caught and wild-gathered food is penalised, and how a zero score counts. */
export function OpinionatedSliders({ values, onChange, resetKey }: GroupProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
            <ValueSlider key={`WIN_DAMPENING-${resetKey}`} {...SLIDERS.WIN_DAMPENING} initialValue={values.winDampening} onChange={value => onChange('winDampening', value)} />
            <ValueSlider key={`OVER_HUNTING-${resetKey}`} {...SLIDERS.OVER_HUNTING} initialValue={values.overHuntingFactor} onChange={value => onChange('overHuntingFactor', value)} />
            <ValueSlider key={`OVER_GATHERING-${resetKey}`} {...SLIDERS.OVER_GATHERING} initialValue={values.overGatheringFactor} onChange={value => onChange('overGatheringFactor', value)} />
            <ValueSlider key={`ZERO_BETTER_MULTIPLIER-${resetKey}`} {...SLIDERS.ZERO_BETTER_MULTIPLIER} initialValue={values.zeroBetterMultiplier} onChange={value => onChange('zeroBetterMultiplier', value)} />
        </div>
    );
}
