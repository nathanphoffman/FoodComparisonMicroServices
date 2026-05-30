'use client';

import { Modal } from "./Modal";

export function FinalIntelligenceExponentModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Emergent Intelligence" onClose={onClose}>
            <p>
                Higher intelligence doesn't just mean "more" of the same — it unlocks qualitatively new cognitive abilities. Complex brain regions responsible for language, self-awareness, planning, and social bonds tend to emerge only once a threshold of neural complexity is reached.
            </p>
            <p>
                This exponent models that non-linearity. Values near 1.0 treat intelligence as roughly proportional to raw neuron score. Higher values amplify differences at the top of the range — widening the gap between animals with rich inner lives (dolphins, pigs) and simpler ones (fish, crabs), reflecting the belief that emergent cognitive complexity carries greater moral weight.
            </p>
            <p>
                Increase this value if you think the capacity for language, emotion, or self-awareness matters morally. Lower it toward 1.0 for a more uniform treatment across intelligence levels.
            </p>
        </Modal>
    );
}
