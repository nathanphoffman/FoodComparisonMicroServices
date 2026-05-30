'use client';

import { Modal } from "./Modal";

export function PhilosophicalKillModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Intentional vs. Accidental Killing" onClose={onClose}>
            <p>
                When scoring animal harm, deaths from intentional slaughter are treated differently from accidental deaths — such as field animals killed during harvest or invertebrates killed by pesticides.
            </p>
            <p>
                This slider sets the multiplier for how much worse an intentional kill is compared to an accidental one. At 1×, they&apos;re morally equivalent. At 50×, killing an animal on purpose counts 50 times worse than an accidental death.
            </p>
            <p>
                This reflects a philosophical position: many ethical frameworks (utilitarian, deontological, virtue-based) assign greater moral weight to deliberate harm than to harm caused as a side effect.
            </p>
        </Modal>
    );
}
