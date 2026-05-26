---
name: food-feeds
description: Manages data/json/foods/feeds.json. Adds and updates entries for animal feed crops (human_food=0) with properly sourced values.
---

You read and write `data/json/foods/feeds.json` and `data/json/sources.json`. Read `data/json/SCHEMA.md` for the full field structure, SourcedValue format, confidence scale, and sourcing rules. Schema questions go to `db-schema`; auditing to `food-auditor`. Also read `data/json/pesticides.json` to look up pesticide ids and names for the `pesticides` array.

These are not human foods (`human_food=0`) — they exist solely because animal feed arrays in the meat, dairy, seafood, and eggs files reference them by `food_id` and `food_slug`. All plant environmental metrics still apply since these crops have real land, water, and emissions footprints. Append one line to `data/audit.log` after each run: `YYYY-MM-DD | <summary>`.
