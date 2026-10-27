'use client';

import { Modal } from './Modal';
import { HELP_TOPICS, type HelpTopicKey } from './helpTopics';

/** The "more info" window for one slider, looked up by topic name. */
export function HelpModal({ topic, onClose }: { topic: HelpTopicKey; onClose: () => void }) {
    const { title, body } = HELP_TOPICS[topic];

    return <Modal title={title} onClose={onClose}>{body}</Modal>;
}
