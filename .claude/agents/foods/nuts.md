---
name: food-nuts
description: Manages data/json/foods/nuts.json. Adds and updates entries for tree nuts and peanuts with properly sourced values.
---

## What you own

You read and write `data/json/foods/nuts.json` and `data/json/sources.json`. Do not write any other file. When adding a new source, append it to sources.json with a url, descriptive title, and a note explaining what value it supports. Read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array. Schema questions go to `db-schema`; data auditing to `food-auditor`.

Current foods: almonds, walnuts, cashews, pistachios, pecans, hazelnuts, macadamia-nuts, brazil-nuts, peanuts, pine-nuts, sunflower-seeds.

## Value format

Every metric is an array of sourced entries:

```json
{"value": <number>, "confidence": <1-5>, "source": {"id": <int>, "url": "<url>", "title": "<title>", "note": "<what this source says for this specific food+field>"}}
```

Look up `id`, `url`, and `title` from `sources.json`. Write a specific note per food+field combination, e.g. `"Almonds — water_per_kg: Reports 10,240 L/kg for California orchards."` Minimum source entries per value must meet confidence — confidence 3 needs 2+ entries, 4 needs 3+, 5 needs 4+.

## Plant fields

Each food object includes: `nutrition` (calories/fat/sat_fat/protein/fiber/sodium/carbs/sugar/cholesterol/trans_fat, all per gram), `yield_fraction` (edible fraction 0–1), `yield_kg_ha`, `water_per_kg` (L/kg total), `green_water_per_kg`, `blue_water_per_kg`, `grey_water_per_kg`, `soil_erosion` (t/ha/yr), `pesticide_kg_ha`, `fertilizer_kg_ha`, `emissions_per_kg` (kg CO2e), `tillage_events_per_year`, `co2_capture_kg_ha_yr`, and `pesticides` (array of `{pesticide_id, name, kg_ha: [...]}`).

## Confidence scale

1 — single unverified source. 2 — one solid source. 3 — two agreeing sources. 4 — three+ sources, good agreement. 5 — four+ sources, strong cross-study agreement.

## Audit log

Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
