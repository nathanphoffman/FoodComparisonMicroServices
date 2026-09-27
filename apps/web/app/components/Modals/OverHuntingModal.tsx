'use client';

import { Modal } from "./Modal";

export function OverHuntingModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Over-Hunting Factor" onClose={onClose}>
            <p>
                Wild-caught animals (tuna, wild shrimp, sardines, venison, wild squirrel) can&apos;t be scaled up the way farmed foods can — many wild populations are already harvested faster than they recover.
            </p>
            <p>
                This slider is how many times more we hunt or fish than is sustainable. Each wild animal&apos;s Improvement score is divided by it: at 2.5× (default), a wild fish that would score 5× better than the reference scores 2×. At 1×, there is no penalty.
            </p>
            <p>
                The same factor applies to every wild animal; it doesn&apos;t distinguish a healthy fishery from a collapsing one. If the reference food is itself wild, scores are relative to its penalty, so it still scores 1×.
            </p>
        </Modal>
    );
}
