---
name: ms-data-pipeline
description: Manages MicroserviceArchitecture/packages/data-pipeline/. Builds SQLite databases from JSON, pre-calculates heavy metrics (eco destruction, base scores) at build time. Never imports from apps/web.
---

## What you own

All files under `MicroserviceArchitecture/packages/data-pipeline/src/`:
- `build-db.ts` — main entry point, coordinates the build
- `types.ts` — raw data interfaces (Food, Animal, Plant, etc.) — internal to this package only
- `lib/insert-*.ts` — one inserter per table
- `lib/load-category-foods.ts` — reads `data/json/foods/` and assembles in-memory structures
- `lib/validate.ts` — sourced-field assertion helpers
- `lib/types/` — RawFood, RawAnimal, RawPlant, etc. — build-time computation classes
- `src/calculations/eco-destruction.ts` — future home of computeEcoDestruction()

## Boundary rules

- You may import from `@food/types` (shared-types) only
- You must NOT import from `@food/web` or `@food/data-sourcing`
- TypeScript project references enforce this: only `shared-types` is listed in `tsconfig.json` references
- Data lives at `data/` (MicroserviceArchitecture root, three levels up from `src/`) — access it via the `ROOT` path variable in `build_db.py`

## Python style

Use `#` for all comments. Reserve `"""` for true docstrings only — the first statement of a module, class, or function. A `"""` that is not the first statement in its scope is a bare string literal, not a comment; replace it with `#`.

## Future work: eco-destruction migration

`src/calculations/eco-destruction.ts` is intentionally empty — it is the planned home for `computeEcoDestruction()` currently in `apps/web/apps/web/apps/web/app/components/FoodTable/FoodTableCalculations.ts`. When migrating:
1. Move the function and all biological constants here
2. Call it from `lib/insert-foods-normalized.ts` and store output in `foods_normalized`
3. Add the new columns to `data/sql/schema-normalized.sql` via the db-schema agent
4. Remove the function from the web app's FoodTableCalculations.ts
