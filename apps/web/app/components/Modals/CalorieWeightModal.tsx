'use client';

import { Modal } from "./Modal";

export function CalorieWeightModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Calorie Weight" onClose={onClose}>
            <p>
                This controls how much caloric density contributes to the food comparison score. Calories are measured per 100g of food.
            </p>
            <p>
                A higher calorie weight means foods that deliver more energy per unit are scored more favorably relative to their environmental or ethical cost. This is useful when comparing foods primarily as energy sources.
            </p>
            <p>
                Calorie, protein, and mass weights always sum to 100% — adjusting one redistributes proportionally among the others.
            </p>
        </Modal>
    );
}
