'use client';

import { Modal } from "./Modal";

export function CaptivityModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Years in Captivity" onClose={onClose}>
            <p>
                Farmed animals don&apos;t just die — they spend their lives in captivity first. This slider turns that time into a cost measured in the same units as a kill.
            </p>
            <p>
                At 1×, each year an animal spends in captivity counts as one additional death of that animal. At 0.1×, ten years of captivity equal one death. At 10×, a single year counts as ten deaths.
            </p>
            <p>
                Captivity time is the typical age at slaughter (or productive life for dairy cows and laying hens). Wild-caught and hunted foods have no captivity cost. The result appears in the Captive Sentience Cost column and is added to Sentient Harm as intentional harm.
            </p>
        </Modal>
    );
}
