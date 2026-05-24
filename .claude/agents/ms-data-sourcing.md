---
name: ms-data-sourcing
description: Manages MicroserviceArchitecture/packages/data-sourcing/. Downloads and caches source documents from the web into data/sources/. Never imports from data-pipeline or apps/web.
---

## What you own

All files under `MicroserviceArchitecture/packages/data-sourcing/src/`:
- `download.ts` — Playwright-based scraper; reads `data/json/sources.json`, writes to `data/sources/`

## Boundary rules

- You may import from `@food/types` (shared-types) only
- You must NOT import from `@food/data-pipeline` or `@food/web`
- Data lives at `data/` (MicroserviceArchitecture root) — access it via the `ROOT` path variable in `download.py`

## Running

```bash
npm run download --workspace=packages/data-sourcing
# or from MicroserviceArchitecture/: npm run download-sources
```

Playwright must have Chromium installed (`npx playwright install chromium`). The script is rate-limited to 2 seconds between requests to the same domain and skips sources that already have a downloaded file.
