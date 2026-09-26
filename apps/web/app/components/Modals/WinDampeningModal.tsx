'use client';

import { Modal } from "./Modal";

export function WinDampeningModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Big-Win Dampening" onClose={onClose}>
            <p>
                The Improvement score compares each food to the reference food on every measure (nutrition, CO₂, sentient harm, water, land use, availability), then combines those comparisons using the Score Priorities.
            </p>
            <p>
                This slider controls how that combining works. Example: a food 100× better than the reference on one measure and equal on the other five (all priorities equal):
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>0 (linear)</strong> — a plain average. The big win dominates: about 17.5× better overall.</li>
                <li><strong>1 (default)</strong> — a geometric average. The big win is shrunk: about 2.2× better. A 100× win exactly cancels a 100× loss elsewhere.</li>
                <li><strong>2 (strong)</strong> — a harmonic average. The weakest measures dominate: about 1.2× better.</li>
            </ul>
            <p>
                Settings above 1 shrink big wins further but also make big losses count more heavily.
            </p>
        </Modal>
    );
}
