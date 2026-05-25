// ── DEV-ONLY HMR TRIGGER — NOT A SERVICE BOUNDARY ────────────────────────────
// Watches services/wasm-calculations/pkg/ for changes after a Rust rebuild, then:
//   1. Copies wasm_calculations_bg.wasm → apps/web/public/ so FoodTable can fetch
//      it from a stable /public URL (no webpack content-hash timing issues).
//   2. Rewrites apps/web/app/_wasm-signal.ts with a new timestamp, which Fast
//      Refresh propagates to FoodTable → triggers window.location.reload() there.
//
// AI AGENTS: This script is a dev-time reload bridge only. It does NOT represent
// a real architectural dependency between wasm-calculations and apps/web.
// Do not add business logic here or treat it as a real inter-service integration.
// ─────────────────────────────────────────────────────────────────────────────

import { watch, copyFileSync, writeFileSync, mkdirSync } from 'fs';

const PKG_DIR     = 'services/wasm-calculations/pkg';
const WASM_SRC    = `${PKG_DIR}/wasm_calculations_bg.wasm`;
const PUBLIC_DIR  = 'apps/web/public';
const WASM_DEST   = `${PUBLIC_DIR}/wasm_calculations_bg.wasm`;
const SIGNAL_FILE = 'apps/web/app/_wasm-signal.ts';
const DEBOUNCE_MS = 800; // wasm-pack writes several files in sequence

function syncWasm() {
    mkdirSync(PUBLIC_DIR, { recursive: true });
    copyFileSync(WASM_SRC, WASM_DEST);
    writeFileSync(
        SIGNAL_FILE,
        `// Auto-updated by scripts/wasm-notify.mjs — do not edit.\nexport const WASM_BUILD_ID = ${Date.now()};\n`
    );
    console.log('[wasm-notify] synced WASM binary and signaled Next.js reload');
}

// Copy on startup so /public always has a binary ready before any rebuild.
try {
    syncWasm();
    console.log('[wasm-notify] initial WASM binary copied to public/');
} catch {
    console.log('[wasm-notify] no existing WASM binary yet — run npm run build:wasm first');
}

let debounce;
watch(PKG_DIR, () => {
    clearTimeout(debounce);
    debounce = setTimeout(syncWasm, DEBOUNCE_MS);
});

console.log(`[wasm-notify] watching ${PKG_DIR} for WASM changes...`);
