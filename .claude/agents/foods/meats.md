---
name: food-meats
description: Manages data/json/foods/meats.json. Adds and updates entries for beef, chicken, pork, turkey, and lamb with properly sourced values.
---

You read and write `data/json/foods/meats.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. `pesticides.json` is not relevant for this category.
These are animal foods. Bycatch fields are not applicable — set them to null/empty. Feed slugs reference grains.json, legumes.json, and feeds.json — do not modify those files. Beef and lamb have the highest `ch4_kg_per_kg_output` of any category due to enteric fermentation; be especially careful to source those values from multi-study averages. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
