import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

// eslint-config-next 15 still ships the old config format; FlatCompat converts it.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        // public/ holds generated WASM glue code, not our source.
        ignores: ['.next/**', 'public/**', 'next-env.d.ts', 'app/_wasm-signal.ts'],
    },
    {
        rules: {
            // Plain ' and " are valid in JSX text; keep them readable instead of &apos; / &quot;.
            'react/no-unescaped-entities': 'off',
        },
    },
];

export default eslintConfig;
