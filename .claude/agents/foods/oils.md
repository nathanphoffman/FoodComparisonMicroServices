---
name: food-oils
description: Manages data/json/foods/oils.json. Adds and updates entries for culinary oils with properly sourced values.
---

You read and write `data/json/foods/oils.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
These are plant foods. Oils are calorie-dense and nearly fat-only — `nutrition.fat` and `nutrition.sat_fat` will dominate the nutrition object; `fiber`, `protein`, and `carbs` should be near zero. `yield_fraction` here represents the oil extraction yield from the source crop (e.g. olives pressed to oil), not a simple edible fraction. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
