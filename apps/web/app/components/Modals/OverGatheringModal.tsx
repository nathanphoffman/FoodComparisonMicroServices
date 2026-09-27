'use client';

import { Modal } from "./Modal";

export function OverGatheringModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Over-Gathering Factor" onClose={onClose}>
            <p>
                Wild-gathered plants (Brazil nuts, pine nuts) come from forests rather than farms, so supply is limited by how much the wild can provide.
            </p>
            <p>
                This slider is how many times more we gather than is sustainable. Each wild plant&apos;s Improvement score is divided by it: at 1.5× (default), a wild nut that would score 3× better than the reference scores 2×. At 1×, there is no penalty.
            </p>
            <p>
                The same factor applies to every wild plant. If the reference food is itself wild, scores are relative to its penalty, so it still scores 1×.
            </p>
        </Modal>
    );
}
