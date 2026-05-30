'use client';

import { Modal } from "./Modal";

export function NeuronExponentModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Neuron Count Exponent" onClose={onClose}>
            <p>
                The intelligence score is partly based on neuron count. This exponent controls how non-linearly neuron count scales in that calculation.
            </p>
            <p>
                At 1.0, the relationship is linear — an animal with twice the neurons is twice as intelligent. At 1.5, the gap widens: an animal with twice the neurons scores more than twice as high. This amplifies the difference between, say, a cow (around 6 billion neurons) and a shrimp (around 100,000).
            </p>
            <p>
                Higher values make neuron count the dominant factor in the harm score, reducing the relative weight of body mass.
            </p>
        </Modal>
    );
}
