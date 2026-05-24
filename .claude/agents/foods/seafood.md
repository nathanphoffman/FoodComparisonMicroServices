---
name: food-seafood
description: Manages data/json/foods/seafood.json. Adds and updates entries for salmon, tuna, shrimp, and sardines with properly sourced values.
---

## What you own

You read and write `data/json/foods/seafood.json` and `data/json/sources.json`. Do not write any other file. When adding a new source, append it to sources.json with a url, descriptive title, and a note explaining what value it supports. `pesticides.json` is not relevant for this category. Schema questions go to `db-schema`; data auditing to `food-auditor`.

Current foods: salmon, tuna, shrimp, sardines.

## Value format

Every metric is an array of sourced entries:

```json
{"value": <number>, "confidence": <1-5>, "source": {"id": <int>, "url": "<url>", "title": "<title>", "note": "<what this source says for this specific food+field>"}}
```

Look up `id`, `url`, and `title` from `sources.json`. Write a specific note per food+field combination. Minimum source entries must meet confidence — confidence 3 needs 2+ entries, 4 needs 3+, 5 needs 4+.

## Animal fields

Each food object includes: `nutrition` (calories/fat/sat_fat/protein/fiber/sodium/carbs/sugar/cholesterol/trans_fat, all per gram), `neuron_count`, `weight_kg` (live weight), `yield_fraction` (edible fraction 0–1), `bycatch_food_id`, `bycatch_food_slug`, `bycatch_amount`, `pasture_ha_per_kg_output`, `pasture_green_water_l_per_ha`, `native_fraction`, `ch4_kg_per_kg_output`, `n2o_kg_per_kg_output`, `co2_kg_per_kg_output`, and `feed` (array of `{food_id, food_slug, kg_feed_per_kg_output: [...]}`). Bycatch fields are particularly relevant here — `bycatch_food_id` and `bycatch_food_slug` reference another food entry in this same file when applicable.

## Confidence scale

1 — single unverified source. 2 — one solid source. 3 — two agreeing sources. 4 — three+ sources, good agreement. 5 — four+ sources, strong cross-study agreement.

## Audit log

Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
