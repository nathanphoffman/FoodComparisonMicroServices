import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

// Next.js compiles JSX itself, so tsconfig leaves it as "preserve"; tests need it turned into plain calls.
// The '@' alias mirrors the "paths" entry in tsconfig.json.
export default defineConfig({
    oxc: { jsx: { runtime: 'automatic' } },
    resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
});
