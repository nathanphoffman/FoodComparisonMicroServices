'use client';

import { Modal } from "./Modal";

export function WeightExponentModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Body Mass Exponent" onClose={onClose}>
            <p>
                Body mass is used as a proxy for biological complexity in the intelligence calculation. This exponent controls how mass scales in that formula.
            </p>
            <p>
                A sub-linear exponent like 0.75 reflects metabolic scaling theory (Kleiber&apos;s law) — smaller animals are disproportionately metabolically active relative to their size, so raw mass overstates their complexity. A value of 1.0 is linear; values below 1.0 reduce the advantage of being larger.
            </p>
            <p>
                For example, 0.75 means a cow (500 kg) doesn&apos;t score 5,000× higher than a mouse (100 g) on mass alone — it scores closer to 167×.
            </p>
        </Modal>
    );
}
