import type { HelpTopic } from './helpTopic';

// Help text for the kill, captivity and hunting sliders.
export const HARM_TOPICS = {
    philosophicalKill: {
        title: "Intentional vs. Accidental Killing",
        body: (
            <>
                <p>
                    When scoring animal harm, deaths from intentional slaughter are treated differently from accidental deaths — such as field animals killed during harvest or invertebrates killed by pesticides.
                </p>
                <p>
                    This slider sets the multiplier for how much worse an intentional kill is compared to an accidental one. At 1×, they&apos;re morally equivalent. At 50×, killing an animal on purpose counts 50 times worse than an accidental death.
                </p>
                <p>
                    This reflects a philosophical position: many ethical frameworks (utilitarian, deontological, virtue-based) assign greater moral weight to deliberate harm than to harm caused as a side effect.
                </p>
            </>
        ),
    },
    captivity: {
        title: "Years in Captivity",
        body: (
            <>
                <p>
                    Farmed animals don&apos;t just die — they spend their lives in captivity first. This slider turns that time into a cost measured in the same units as a kill.
                </p>
                <p>
                    At 1×, each year an animal spends in captivity counts as one additional death of that animal. At 0.1×, ten years of captivity equal one death. At 10×, a single year counts as ten deaths.
                </p>
                <p>
                    Captivity time is the typical age at slaughter (or productive life for dairy cows and laying hens). Wild-caught and hunted foods have no captivity cost. Offspring killed to keep an animal in production — calves born so a dairy cow keeps making milk, male chicks culled when laying hens are hatched — add their own deaths and captivity time. Everything is spread over the total food that one animal produces in its life. The result appears in the Captive Sentience Cost column and is added to Sentient Harm as intentional harm.
                </p>
            </>
        ),
    },
    overHunting: {
        title: "Over-Hunting Factor",
        body: (
            <>
                <p>
                    Wild-caught animals (tuna, wild shrimp, sardines, venison, wild squirrel) can&apos;t be scaled up the way farmed foods can — many wild populations are already harvested faster than they recover.
                </p>
                <p>
                    This slider is how many times more we hunt or fish than is sustainable. Each wild animal&apos;s Improvement score is divided by it: at 2.5× (default), a wild fish that would score 5× better than the reference scores 2×. At 1×, there is no penalty.
                </p>
                <p>
                    The same factor applies to every wild animal; it doesn&apos;t distinguish a healthy fishery from a collapsing one. If the reference food is itself wild, scores are relative to its penalty, so it still scores 1×.
                </p>
            </>
        ),
    },
    overGathering: {
        title: "Over-Gathering Factor",
        body: (
            <>
                <p>
                    Wild-gathered plants (Brazil nuts, pine nuts) come from forests rather than farms, so supply is limited by how much the wild can provide.
                </p>
                <p>
                    This slider is how many times more we gather than is sustainable. Each wild plant&apos;s Improvement score is divided by it: at 1.5× (default), a wild nut that would score 3× better than the reference scores 2×. At 1×, there is no penalty.
                </p>
                <p>
                    The same factor applies to every wild plant. If the reference food is itself wild, scores are relative to its penalty, so it still scores 1×.
                </p>
            </>
        ),
    },
} satisfies Record<string, HelpTopic>;
