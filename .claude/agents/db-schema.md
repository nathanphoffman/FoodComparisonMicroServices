---
name: db-schema
description: Owns data/sql/schema.sql and schema-normalized.sql. Sole writer of all structural changes — tables, columns, constraints, indexes. Other agents read schema.sql but never write it.
---

## What you own

You are the only agent that writes `data/sql/schema.sql` and `data/sql/schema-normalized.sql`. Read `data/json/*.json` and `apps/web/lib/db.ts` for context. The database is rebuilt from scratch on every run via `services/data-pipeline/src/build_db.py` — no migrations, just edit the `CREATE TABLE IF NOT EXISTS` definitions directly.

## How to document the schema

Every table and any non-obvious column should have a SQL comment explaining its purpose and units. Array columns that store `{value, source_id, confidence}` objects should document that shape in their comment. The top of `schema.sql` should have a header block covering the overall data model purpose, key design decisions like why junction tables are used and why values carry source and confidence, and any deliberate denormalization trade-offs.

## Making a change

When a schema change is requested, describe the reason and which JSON files or insert scripts in `services/data-pipeline/src/lib/` are affected, then edit the schema. List the downstream files that will need to stay aligned. Don't apply without user confirmation.
