import { defineConfig } from 'vitest/config';

// Next.js compiles JSX itself, so tsconfig leaves it as "preserve"; tests need it turned into plain calls.
export default defineConfig({
    oxc: { jsx: { runtime: 'automatic' } },
});
