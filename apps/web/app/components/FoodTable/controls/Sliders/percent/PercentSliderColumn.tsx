import { Slider } from "../../../../Inputs/Slider";
import { MAX_LEVEL } from "./percentLevels";

type Props = {
    label: string;
    description: string;
    level: number;

    /** This slider's share of all the sliders, as a percentage. */
    share: number;
    onLevelChange: (level: number) => void;

    /** Shows a "more info" link when given. */
    onHelp?: () => void;
};

/** One slider from "Don't Care" to "Care The Most", with its label, share and description. */
export function PercentSliderColumn({ label, description, level, share, onLevelChange, onHelp }: Props) {
    return (
        <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-xs text-neutral-500">
                <span>{label}</span>
                <span className="font-medium text-neutral-700">{Math.round(share)}%</span>
            </div>
            <Slider min={0} max={MAX_LEVEL} step={1} value={level} onChange={onLevelChange} />
            <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Don&apos;t Care</span>
                <span>Care The Most</span>
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
                {description}
                {onHelp && (
                    <button onClick={onHelp} className="ml-1.5 text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">more info</button>
                )}

            </div>
        </div>
    );
}
