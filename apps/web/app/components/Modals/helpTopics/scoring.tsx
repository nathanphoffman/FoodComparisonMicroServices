import type { HelpTopic } from './helpTopic';

// Help text for the scoring-method and nutrition sliders.
export const SCORING_TOPICS = {
    winDampening: {
        title: "Big-Win Dampening",
        body: (
            <>
                <p>
                    The Improvement score compares each food to the reference food on every measure (nutrition, CO₂, sentient harm, water, land use, availability), then combines those comparisons using the Score Priorities.
                </p>
                <p>
                    This slider controls how that combining works. Example: a food 100× better than the reference on one measure and equal on the other five (all priorities equal):
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>0 (linear)</strong> — a plain average. The big win dominates: about 17.5× better overall.</li>
                    <li><strong>1 (default)</strong> — a geometric average. The big win is shrunk: about 2.2× better. A 100× win exactly cancels a 100× loss elsewhere.</li>
                    <li><strong>2 (strong)</strong> — a harmonic average. The weakest measures dominate: about 1.2× better.</li>
                </ul>
                <p>
                    Settings above 1 shrink big wins further but also make big losses count more heavily.
                </p>
            </>
        ),
    },
    nutritionWeights: {
        title: "Nutrition Score Weights",
        body: (
            <>
                <p>
                    The Nutrition score adds up points for each 100 g of food, then scales them to per 100 calories so foods are compared calorie for calorie:
                </p>
                <p className="font-mono text-xs">
                    points = protein × protein quality + fiber + vitamins & minerals − saturated fat − free sugar − sodium
                </p>
                <p>
                    Each slider sets how many points one unit of that nutrient is worth. Protein, fiber and vitamins & minerals help the score; saturated fat, free sugar and sodium harm it. Setting a slider to 0 leaves that nutrient out.
                </p>
                <p>
                    Vitamins & minerals count each nutrient's share of its daily value, so 100% of the daily value of iron is worth the slider's points. Nutrients most people fall short on (like calcium and potassium) count double.
                </p>
                <p>
                    Free sugar is sugar beyond the fiber allowance: with an allowance of 5, a food with 2 g of fiber has its first 10 g of sugar ignored. This keeps whole fruit from being treated like table sugar.
                </p>
                <p>
                    Protein quality adjusts the protein points for how well the protein matches what the body needs. For each of the nine essential amino acids, the food's amount per gram of protein is compared with the FAO/WHO adult requirement. The weakest one sets the food's amino acid score (capped at 100%): wheat is short on lysine and scores about 55%, while eggs, meat and dairy score 100%. The Protein Quality slider is how much of the protein points are lost at that shortfall: at 50%, a food scoring 55% keeps about 78% of its protein points. Foods with no amino acid data aren't penalised. Hover a food's nutrition figure to see its full amino acid profile.
                </p>
                <p>
                    Foods with no calories (like diet soda) always score 0.
                </p>
            </>
        ),
    },
    landType: {
        title: "Land Use by Land Type",
        body: (
            <>
                <p>
                    Not all land is equal. A hectare of Iowa cropland that was prairie a century ago does far less harm than a hectare of Indonesian rainforest cleared last year for palm oil.
                </p>
                <p>
                    Each food is tagged with a rough split of where it&apos;s grown (for animals, their pasture and feed crops). The Land Use score is the land area multiplied by the average of these sliders over that split. Palm oil (85% tropical forest, 15% peat swamp) counts at about 8.8× its area by default; wheat (mostly prairie) at about 0.55×.
                </p>
                <p>
                    Defaults come from the biodiversity factors recommended by UNEP for life cycle assessment (Chaudhary &amp; Brooks 2018): how many species are put at risk of extinction per m² of farmland in each type of ecosystem, relative to temperate forest. Tropical forest is about 10× (far more species, many found nowhere else); wetlands and mangroves about 1.8×; tropical savanna about 1.2×; dry and Mediterranean land about 0.85×; temperate grassland about 0.45×. Carbon from clearing land is not included here — it is already in the CO₂ score.
                </p>
                <p>
                    These sliders only change the Land Use score. Animal deaths from land clearing and the Availability score still use the real land area. If Land Use has 0 priority in Score Priorities, these sliders have no effect on the Improvement score.
                </p>
                <p>
                    Seafood and wild foods (venison, wild Brazil nuts) have no farmland split and are unaffected.
                </p>
            </>
        ),
    },
} satisfies Record<string, HelpTopic>;
