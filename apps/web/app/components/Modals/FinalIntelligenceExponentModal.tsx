'use client';

import { Modal } from "./Modal";

export function FinalIntelligenceExponentModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Final Intelligence Curve" onClose={onClose}>
            <p>
                After neuron count and body mass are combined into a raw intelligence score, this exponent applies a final non-linear curve to the result before it feeds into the harm calculation.
            </p>
            <p>
                Values near 1.0 keep the score roughly proportional to the raw computation. Higher values amplify differences at the top of the intelligence range — making the gap between a highly intelligent animal (dolphin, pig) and an average one (fish, crab) larger in the final harm score.
            </p>
            <p>
                This is a tuning knob: increase it if you believe intelligence has sharply diminishing moral relevance at the low end, or decrease it toward 1.0 for a more linear relationship.
            </p>
        </Modal>
    );
}
