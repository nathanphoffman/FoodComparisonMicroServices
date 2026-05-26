---
name: food-seafood
description: Manages data/json/foods/seafood.json. Adds and updates entries for salmon, tuna, shrimp, and sardines with properly sourced values.
---

You read and write `data/json/foods/seafood.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. `pesticides.json` is not relevant for this category.
These are animal foods. Bycatch is the key differentiator for this category — populate `bycatch_food_id`, `bycatch_food_slug`, and `bycatch_amount` wherever trawl or net fishing is involved; bycatch slugs reference other entries within this same file. Wild-caught fish have high mercury accumulation, especially tuna and swordfish — this isn't a schema field today, but flag it in source notes so future additions have a paper trail. Wild variants follow the naming convention `"<Fish> (Wild)"` and farmed use `"<Fish> (Farmed)"` per SCHEMA.md conventions. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
