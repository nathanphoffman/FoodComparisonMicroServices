// Creates app/_wasm-signal.ts if it doesn't exist yet. The file is gitignored
// because scripts/wasm-notify.mjs (repo root) rewrites it on every WASM rebuild
// in dev, but FoodTableWASMIntegration.ts imports it, so it must always exist.

import { existsSync, writeFileSync } from 'fs';

const SIGNAL_FILE = 'app/_wasm-signal.ts';

if (!existsSync(SIGNAL_FILE)) {
    writeFileSync(
        SIGNAL_FILE,
        `// Auto-updated by scripts/wasm-notify.mjs — do not edit.\nexport const WASM_BUILD_ID = 0;\n`
    );
}
