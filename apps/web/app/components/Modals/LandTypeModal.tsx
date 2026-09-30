'use client';

import { Modal } from "./Modal";

export function LandTypeModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Land Use by Land Type" onClose={onClose}>
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
        </Modal>
    );
}
