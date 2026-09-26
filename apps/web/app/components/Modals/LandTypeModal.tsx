'use client';

import { Modal } from "./Modal";

export function LandTypeModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Land Use by Land Type" onClose={onClose}>
            <p>
                Not all land is equal. A hectare of Iowa cropland that was prairie a century ago does far less harm than a hectare of Indonesian rainforest cleared last year for palm oil.
            </p>
            <p>
                Each food is tagged with a rough split of where it&apos;s grown (for animals, their pasture and feed crops). The Land Use score is the land area multiplied by the average of these sliders over that split. Palm oil (85% tropical forest, 15% peat swamp) counts at about 2.85× its area by default; wheat (mostly prairie) at about 0.8×.
            </p>
            <p>
                Defaults: tropical forest is highest because clearing it destroys the most biodiversity and carbon. Wetlands and mangroves hold a lot of carbon. Tropical savanna like Brazil&apos;s Cerrado is still being cleared. Temperate forest and dry land are neutral (dry land&apos;s water use is already in the Water score). Temperate grassland is lowest since most of it has been farmed for a long time.
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
