'use client';

import { Modal } from "./Modal";

export function WetMassWeightModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Wet Mass Weight" onClose={onClose}>
            <p>
                This controls how much the weight of a food as you eat it — water included — contributes to the food comparison score. Beans, lentils, chickpeas, rice and quinoa are counted cooked, so the water they absorb while cooking counts toward their weight.
            </p>
            <p>
                Unlike dry mass, wet mass rewards watery foods: a kg of cucumber or milk counts the same as a kg of almonds. Use it to compare foods by how much food ends up on the plate rather than by nutrients.
            </p>
            <p>
                Calorie, protein, dry mass, and wet mass sliders move independently — the percentage shown is each one&apos;s share of the total, so only how they compare to each other matters.
            </p>
        </Modal>
    );
}
