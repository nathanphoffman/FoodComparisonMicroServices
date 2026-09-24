'use client';

import { Modal } from "./Modal";

export function ProteinWeightModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Protein Weight" onClose={onClose}>
            <p>
                This controls how much protein density contributes to the food comparison score. Protein is measured in grams per 100g of food.
            </p>
            <p>
                A higher protein weight scores foods more favorably when they deliver more protein relative to their environmental or ethical cost — useful when comparing foods as protein sources.
            </p>
            <p>
                Calorie, protein, and mass sliders move independently — the percentage shown is each one's share of the total, so only how they compare to each other matters.
            </p>
        </Modal>
    );
}
