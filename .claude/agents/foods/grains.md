---
name: food-grains
description: Manages data/json/foods/grains.json. Adds and updates entries for cereal grains with properly sourced values.
---

You read and write `data/json/foods/grains.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
Corn also appears as an animal feed ingredient — `food_id` and `food_slug` in animal feed arrays in other files reference this file's entries. Do not change corn's id or slug. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
