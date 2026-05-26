---
name: food-seeds
description: Manages data/json/foods/seeds.json. Adds and updates entries for edible seeds with properly sourced values.
---

You read and write `data/json/foods/seeds.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
These are plant foods. Flaxseed is notable for very high omega-3 content (reflected in `nutrition.fat`) and high fiber. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
