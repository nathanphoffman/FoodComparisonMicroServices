import type { HelpTopic } from './helpTopic';

// Help text for the intelligence and zero-score sliders.
export const INTELLIGENCE_TOPICS = {
    neuronExponent: {
        title: "Neuron Count Exponent",
        body: (
            <>
                <p>
                    The intelligence score is partly based on neuron count. This exponent controls how non-linearly neuron count scales in that calculation.
                </p>
                <p>
                    At 1.0, the relationship is linear — an animal with twice the neurons is twice as intelligent. At 1.5, the gap widens: an animal with twice the neurons scores more than twice as high. This amplifies the difference between, say, a cow (around 6 billion neurons) and a shrimp (around 100,000).
                </p>
                <p>
                    Higher values make neuron count the dominant factor in the harm score, reducing the relative weight of body mass.
                </p>
            </>
        ),
    },
    weightExponent: {
        title: "Body Mass Exponent",
        body: (
            <>
                <p>
                    Body mass is used as a proxy for biological complexity in the intelligence calculation. This exponent controls how mass scales in that formula.
                </p>
                <p>
                    A sub-linear exponent like 0.75 reflects metabolic scaling theory (Kleiber&apos;s law) — smaller animals are disproportionately metabolically active relative to their size, so raw mass overstates their complexity. A value of 1.0 is linear; values below 1.0 reduce the advantage of being larger.
                </p>
                <p>
                    For example, 0.75 means a cow (500 kg) doesn&apos;t score 5,000× higher than a mouse (100 g) on mass alone — it scores closer to 167×.
                </p>
            </>
        ),
    },
    finalIntelligenceExponent: {
        title: "Emergent Intelligence",
        body: (
            <>
                <p>
                    Higher intelligence doesn't just mean "more" of the same — it unlocks qualitatively new cognitive abilities. Complex brain regions responsible for language, self-awareness, planning, and social bonds tend to emerge only once a threshold of neural complexity is reached.
                </p>
                <p>
                    This exponent models that non-linearity. Values near 1.0 treat intelligence as roughly proportional to raw neuron score. Higher values amplify differences at the top of the range — widening the gap between animals with rich inner lives (dolphins, pigs) and simpler ones (fish, crabs), reflecting the belief that emergent cognitive complexity carries greater moral weight.
                </p>
                <p>
                    Increase this value if you think the capacity for language, emotion, or self-awareness matters morally. Lower it toward 1.0 for a more uniform treatment across intelligence levels.
                </p>
            </>
        ),
    },
    zeroBetterMultiplier: {
        title: "Zero Impact Bonus",
        body: (
            <>
                <p>
                    Some foods score zero on a dimension — for example, farmed mussels use no cropland and wild plants have no direct kill. Zero is genuinely better than any non-zero value, but a log-scale comparison can&apos;t represent &quot;infinitely better.&quot;
                </p>
                <p>
                    This slider sets how many times better a zero score is treated compared to the next best non-zero food in the comparison. At 1×, a zero is treated the same as the best non-zero food. At 2× (default), it counts twice as good. At 10×, it counts ten times as good.
                </p>
                <p>
                    A higher value gives more credit to foods that completely eliminate a harm category. A lower value treats zero as only marginally better than near-zero.
                </p>
            </>
        ),
    },
} satisfies Record<string, HelpTopic>;
