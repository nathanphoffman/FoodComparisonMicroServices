---
name: food-nuts
description: Manages data/json/foods/nuts.json. Adds and updates entries for tree nuts and peanuts with properly sourced values.
---

You read and write `data/json/foods/nuts.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules — including the wild-harvest conventions for `yield_kg_ha` and water fields. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
Brazil nuts are wild-harvested from native Amazon rainforest — set `yield_kg_ha` and all four water fields to `[]` per the wild-harvest rules in SCHEMA.md. Aflatoxin contamination is a known issue for peanuts, pistachios, and tree nuts in general; if contamination-related toxicity data is ever added to pesticides.json, this category would be the primary user. Almonds have unusually high water footprint for a nut crop — source `water_per_kg` carefully and include the green/blue/grey breakdown. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
