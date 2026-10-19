import type { HelpTopic } from './helpTopic';

// Help text for the water sliders.
export const WATER_TOPICS = {
    greenWater: {
        title: "Green Water (Rain Water)",
        body: (
            <>
                <p>
                    Green water refers to rainwater stored in the soil and taken up directly by crops — no irrigation required. It represents the &ldquo;natural&rdquo; share of a food&apos;s water footprint.
                </p>
                <p>
                    This slider controls how much weight green water use has in the overall water score. Lower values mean only actively diverted water (blue water) matters. Higher values count all water the crop consumed, including rain.
                </p>
                <p>
                    For most crops, green water dominates. For irrigated rice or almonds, blue water is larger relative to green.
                </p>
            </>
        ),
    },
    greyWater: {
        title: "Grey Water (Pollution Water)",
        body: (
            <>
                <p>
                    Grey water is a measure of water pollution — specifically, the volume of freshwater needed to dilute agricultural pollutants (pesticides, fertilizers, runoff) down to safe concentrations. It doesn&apos;t represent water consumed, but water <em>impacted</em>.
                </p>
                <p>
                    This slider controls how much weight grey water pollution has in the water footprint score. Set it higher if you consider water quality degradation as important as raw consumption.
                </p>
                <p>
                    Conventionally grown crops with heavy pesticide use tend to have large grey water footprints even if they use relatively little irrigation.
                </p>
            </>
        ),
    },
} satisfies Record<string, HelpTopic>;
