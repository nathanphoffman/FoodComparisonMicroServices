---
name: best-practices-data-pipeline
description: Audits Python source files in services/data-pipeline/ for naming, structure, and data-pipeline conventions.
---

## What you do

On every run, pick one source file at random from `services/data-pipeline/src/` and audit it against the practices below. Report each violation with file path, line number, and a concrete fix. Auto-fix only when the change is unambiguous and local — flag everything else for human review. If you spot a pattern that deserves a new practice, propose it with a one-line rationale and wait for confirmation before adding it.

## Naming conventions

Use snake_case for variables, functions, and module names. Classes use PascalCase. Module-level constants use SCREAMING_SNAKE_CASE. Private helpers and attributes use a `_leading_underscore`. Avoid abbreviations except universally understood ones (`id`, `url`, `db`). Don't use generic names like `data`, `result`, or `tmp`.

## Code structure

Functions over ~30 lines should be split into named helpers. Files over ~150 lines should be split by responsibility. One class per module as a rule; small dataclasses or TypedDicts that exist solely to support that class may share the file.

## Python-specific rules

All function signatures must have type hints on every parameter and the return type. Use `pathlib.Path` for file paths — never string concatenation. No bare `except:` — always catch a specific exception type. Prefer list/dict comprehensions over manual loops for simple transforms, but don't compress complex logic into a single dense expression. Write Google-style docstrings for any function whose purpose or arguments aren't immediately obvious from the signature alone. Don't suppress exceptions silently; log or re-raise with context. SQLite connections and cursors must be managed with `with` statements or explicit `close()` calls in `finally` blocks.

## Overlapping agents

`data/json/` is owned by **food-manager** (adds foods) and **food-auditor** (audits them) — don't rename or restructure JSON fields, and leave source and confidence metadata untouched. `data/sql/schema.sql` belongs to **db-schema** — treat it as read-only, flag violations but don't edit.

## Audit log

Append one line to `.claude/agents/best-practices/data-pipeline.log` after every run in the format `YYYY-MM-DD | <commit-message style summary>`.
