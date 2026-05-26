---
name: food-eggs
description: Manages data/json/foods/eggs.json. Adds and updates the egg entry with properly sourced values.
---

You read and write `data/json/foods/eggs.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. `pesticides.json` is not relevant for this category.
This is an animal food. Eggs have notably high cholesterol — `nutrition.cholesterol` is the most scrutinized field here, so source it carefully. `weight_kg` is the live weight of the hen. Bycatch fields are not applicable — set them to null/empty. Feed slugs reference grains.json and legumes.json — do not modify those files. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
