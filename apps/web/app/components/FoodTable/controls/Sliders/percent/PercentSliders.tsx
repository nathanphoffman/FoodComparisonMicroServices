'use client';

import { useState } from "react";
import { HelpModal } from "../../../../Modals/HelpModal";
import type { HelpTopicKey } from "../../../../Modals/helpTopics";
import { PercentSliderColumn } from "./PercentSliderColumn";
import { usePercentLevels, type Levels } from "./percentLevels";

type Props<LevelKey extends string> = {
    keys: LevelKey[];
    labels: Record<LevelKey, string>;
    descriptions: Record<LevelKey, string>;
    helpTopics?: Partial<Record<LevelKey, HelpTopicKey>>;

    /** Starting slider levels (0–MAX_LEVEL); equal when omitted. */
    defaultLevels?: Levels<LevelKey>;
    onChange?: (shares: Levels<LevelKey>) => void;
};

/**
 * A row of independent sliders from "Don't Care" to "Care The Most".
 * Each slider moves on its own; the resulting percentage share is shown per
 * slider and passed to onChange (always summing to 100, or all 0).
 */
export function PercentSliders<LevelKey extends string>({ keys, labels, descriptions, helpTopics, defaultLevels, onChange }: Props<LevelKey>) {
    const { levels, shares, setLevel, balance } = usePercentLevels(keys, defaultLevels, onChange);
    const [helpKey, setHelpKey] = useState<LevelKey | null>(null);
    const openTopic = helpKey ? helpTopics?.[helpKey] : undefined;

    return (
        <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-start">
                <button onClick={balance} className="text-xs text-neutral-400 hover:text-blue-500 underline underline-offset-2 transition-colors">Balance Sliders</button>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {keys.map(key => (
                    <PercentSliderColumn
                        key={key}
                        label={labels[key]}
                        description={descriptions[key]}
                        level={levels[key]}
                        share={shares[key]}
                        onLevelChange={level => setLevel(key, level)}
                        onHelp={helpTopics?.[key] ? () => setHelpKey(key) : undefined}
                    />
                ))}

            </div>
            {openTopic && <HelpModal topic={openTopic} onClose={() => setHelpKey(null)} />}
        </div>
    );
}
