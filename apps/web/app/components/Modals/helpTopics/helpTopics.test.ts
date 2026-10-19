import { describe, expect, it } from 'vitest';
import { HELP_TOPICS } from './index';

describe('help topics', () => {
    it('each has a title and some text to show', () => {
        for (const [key, topic] of Object.entries(HELP_TOPICS)) {
            expect(topic.title.length, `${key} title`).toBeGreaterThan(0);
            expect(topic.body, `${key} body`).toBeTruthy();
        }
    });

    it('have different titles, so two sliders never open the same-looking window', () => {
        const titles = Object.values(HELP_TOPICS).map(topic => topic.title);
        expect(new Set(titles).size).toBe(titles.length);
    });
});
