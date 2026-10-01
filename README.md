# Food Comparison

Compares foods by nutrition, emissions, land use, water, and harm to sentient animals, with sliders to weight what you care about.

## How it fits together

```
data/json  ──(data-pipeline)──►  data/db/*.db  ──►  apps/api (C#)  ──►  apps/web (Next.js)
                                                                            │
                                         services/wasm-calculations (Rust) ─┘  scoring runs in the browser
```

| Folder | What it is |
| --- | --- |
| `apps/web` | Next.js front end. The food table fetches from the API; the `/foods` pages read the SQLite files directly. |
| `apps/api` | ASP.NET Core API that serves food rows from the SQLite database. |
| `services/wasm-calculations` | Rust scoring code compiled to WebAssembly and run in the browser. |
| `services/data-pipeline` | Python. Builds the SQLite databases in `data/db/` from the JSON in `data/json/`. |
| `services/data-sourcing` | Python + Playwright. Downloads the source documents listed in `data/json/sources.json`. |
| `data/json` | The food data itself. See `SCHEMA.md` and `CORRECTIONS.md`. |
| `data/sql` | Database schemas used by the pipeline. |
| `scripts/wasm-notify.mjs` | Dev-only helper that reloads the web app after a WASM rebuild. |

## Prerequisites

- Node + pnpm (`corepack enable`)
- .NET 10 SDK
- Rust, plus `wasm-pack` and `cargo-watch` (`cargo install wasm-pack cargo-watch`)
- Python 3.11+ (and `playwright` if you use data-sourcing)

## Getting started

```bash
pnpm install
pnpm build-db     # builds data/db/ from data/json/ and bumps DB_VERSION in apps/web/next.config.ts
pnpm build:wasm   # builds the Rust scoring package the web app depends on
pnpm dev          # runs web (:3000), api (:5050), wasm watcher and reload helper together
```

Run `pnpm build-db` again whenever you change anything in `data/json/`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Everything at once |
| `pnpm dev:web` / `dev:api` / `dev:wasm` | One piece at a time |
| `pnpm build` | Production build of the web app |
| `pnpm build:wasm` | Build the WASM package |
| `pnpm typecheck` | Type-check the web app (`tsc`) |
| `pnpm lint` | Lint the web app (ESLint) |
| `pnpm build-db` | Rebuild the SQLite databases |
| `pnpm download` | Download source documents into `data/sources/` |

## Configuration

| Variable | Used by | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:5050` |
| `DATA_DIR` | web, api | `<repo>/data/db` |
| `DB_VERSION` | web (set in `next.config.ts`), api (optional pin) | latest built version |
| `AllowedOrigins__0` | api (CORS) | `http://localhost:3000` |

## Deployment

Both apps deploy to Railway from their Dockerfiles (`apps/*/railway.json`). Each Docker build runs the data pipeline itself, so `data/db/` is never committed.
