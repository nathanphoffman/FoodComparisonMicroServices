'use client';

import { Modal } from "./Modal";

export function GreenWaterModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Green Water (Rain Water)" onClose={onClose}>
            <p>
                Green water refers to rainwater stored in the soil and taken up directly by crops — no irrigation required. It represents the &ldquo;natural&rdquo; share of a food&apos;s water footprint.
            </p>
            <p>
                This slider controls how much weight green water use has in the overall water score. Lower values mean only actively diverted water (blue water) matters. Higher values count all water the crop consumed, including rain.
            </p>
            <p>
                For most crops, green water dominates. For irrigated rice or almonds, blue water is larger relative to green.
            </p>
        </Modal>
    );
}
