'use client';

import { Modal } from "./Modal";

export function MassWeightModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Mass Weight" onClose={onClose}>
            <p>
                This controls how much raw mass (volume) contributes to the food comparison score, measured per 100g serving.
            </p>
            <p>
                A higher mass weight favors foods that provide more physical bulk relative to their cost — useful when satiety or portion size matters more than caloric or protein efficiency.
            </p>
            <p>
                Calorie, protein, and mass sliders move independently — the percentage shown is each one's share of the total, so only how they compare to each other matters.
            </p>
        </Modal>
    );
}
