'use client';

import { Modal } from "./Modal";

export function GreyWaterModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Grey Water (Pollution Water)" onClose={onClose}>
            <p>
                Grey water is a measure of water pollution — specifically, the volume of freshwater needed to dilute agricultural pollutants (pesticides, fertilizers, runoff) down to safe concentrations. It doesn&apos;t represent water consumed, but water <em>impacted</em>.
            </p>
            <p>
                This slider controls how much weight grey water pollution has in the water footprint score. Set it higher if you consider water quality degradation as important as raw consumption.
            </p>
            <p>
                Conventionally grown crops with heavy pesticide use tend to have large grey water footprints even if they use relatively little irrigation.
            </p>
        </Modal>
    );
}
