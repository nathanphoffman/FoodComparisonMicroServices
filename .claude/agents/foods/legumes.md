---
name: food-legumes
description: Manages data/json/foods/legumes.json. Adds and updates entries for soy, lentils, chickpeas, and black-beans with properly sourced values.
---

You read and write `data/json/foods/legumes.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
These are plant foods. Soy also appears as an animal feed ingredient — animal feed arrays in other files reference this file's `food_id` and `food_slug`. Do not change soy's id or slug. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
