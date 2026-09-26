'use client';

import { Modal } from "./Modal";

export function DryMassWeightModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Dry Mass Weight" onClose={onClose}>
            <p>
                This controls how much dry mass — the weight of a food with all its water removed — contributes to the food comparison score. It is estimated as protein + fat + carbohydrate (including fiber).
            </p>
            <p>
                Unlike raw weight, dry mass isn&apos;t inflated by water, so watery foods like milk or cucumber don&apos;t look like more food than they are, and it is the same whether a food is weighed raw or cooked. Compared with calories, it counts carbohydrate and fiber more fairly against fat.
            </p>
            <p>
                Calorie, protein, and dry mass sliders move independently — the percentage shown is each one&apos;s share of the total, so only how they compare to each other matters.
            </p>
        </Modal>
    );
}
