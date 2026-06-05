'use client';

import { Modal } from "./Modal";

export function ZeroBetterMultiplierModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Zero Impact Bonus" onClose={onClose}>
            <p>
                Some foods score zero on a dimension — for example, farmed mussels use no cropland and wild plants have no direct kill. Zero is genuinely better than any non-zero value, but a log-scale comparison can&apos;t represent &quot;infinitely better.&quot;
            </p>
            <p>
                This slider sets how many times better a zero score is treated compared to the next best non-zero food in the comparison. At 1×, a zero is treated the same as the best non-zero food. At 2× (default), it counts twice as good. At 10×, it counts ten times as good.
            </p>
            <p>
                A higher value gives more credit to foods that completely eliminate a harm category. A lower value treats zero as only marginally better than near-zero.
            </p>
        </Modal>
    );
}
