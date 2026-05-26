---
name: food-leafy
description: Manages data/json/foods/leafy.json. Adds and updates entries for leafy greens with properly sourced values.
---

You read and write `data/json/foods/leafy.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
These are plant foods. Leafy greens are among the most pesticide-exposed crops in consumer surveys — source `pesticide_kg_ha` and the per-pesticide breakdown carefully. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
