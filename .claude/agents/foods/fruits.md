---
name: food-fruits
description: Manages data/json/foods/fruits.json. Adds and updates entries for fruits with properly sourced values.
---

You read and write `data/json/foods/fruits.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.
These are plant foods. Pay attention to `yield_fraction` — many fruits have large inedible portions (peel, pit, husk) that significantly affect the edible fraction. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
