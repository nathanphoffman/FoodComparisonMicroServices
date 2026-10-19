import { COMPARE_BY_TOPICS } from './compareBy';
import { WATER_TOPICS } from './water';
import { INTELLIGENCE_TOPICS } from './intelligence';
import { HARM_TOPICS } from './harm';
import { SCORING_TOPICS } from './scoring';
import type { HelpTopic } from './helpTopic';

const ALL_TOPICS = {
    ...COMPARE_BY_TOPICS,
    ...WATER_TOPICS,
    ...INTELLIGENCE_TOPICS,
    ...HARM_TOPICS,
    ...SCORING_TOPICS,
} satisfies Record<string, HelpTopic>;

/** Names a slider's help text, so sliders point at a topic instead of carrying a window of their own. */
export type HelpTopicKey = keyof typeof ALL_TOPICS;

export const HELP_TOPICS: Record<HelpTopicKey, HelpTopic> = ALL_TOPICS;
