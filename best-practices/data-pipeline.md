# Best practices — services/data-pipeline (Python)

## Naming

Use `snake_case` for everything except class names, which use `PascalCase`. Names spell things out completely — no abbreviations, no acronyms, no single-letter variables anywhere including comprehension expressions. Write `food_item` not `f`, `source_id` not `sid`, `emissions_per_kilogram` not `epk`. The only exceptions are domain-standard terms like `id`, `db`, and `url`. Avoid generic names like `data`, `result`, `temp`, or `value`. Module-level constants use `SCREAMING_SNAKE_CASE`.

## Type annotations

Every function must have type annotations on all parameters and the return value. Use `TypedDict` for data shapes that flow to and from JSON — see `food_types.py` as the reference. Use the built-in generic forms (`list[Food]`, `dict[str, float]`) rather than `List` and `Dict` from `typing`. Use `Optional[X]` only when you need the older syntax; prefer `X | None` in Python 3.10+ contexts.

## Functions and files

Prefer more, smaller functions and more, smaller files over large ones. A function that does two things should be two functions. A file that covers two concerns should be two files. Functions over roughly 20 lines should be broken into named helpers. Files over roughly 100 lines should be split by responsibility. When in doubt, extract — a well-named 5-line function is always better than an inline block with a comment. Each `insert_*.py` module owns exactly one `insert()` function that takes a connection and its data — do not put multiple insert operations in one module. `build_db.py` is the only orchestrator; helper modules must not call each other.

## Regex

Avoid regex entirely when string methods, `Path` operations, or explicit parsing would be clearer — which is almost always. When regex truly is the right choice, assign it to a named module-level constant and include a comment in plain English explaining exactly what the pattern matches, what it rejects, and why no named alternative was used.

## Imports

Use absolute imports within the package (`from src.food_types import Food`). Group stdlib, then third-party, then internal imports, separated by blank lines. Do not use star imports.

## Constants and paths

All paths are derived from `Path(__file__).resolve().parents[N]` — never hardcode absolute paths, never use `os.path`. Module-level `ROOT`, `DATA_DIR`, `JSON_DIR`, and `SQL_DIR` constants are the single source of truth for the layout. Any new file-system reference follows the same pattern.

## Error handling

Functions that can fail on missing data should raise `RuntimeError` or `ValueError` with a message that includes the offending value and the expected format. Never silently return a default when a missing value indicates a data integrity problem. `main()` in `build_db.py` catches top-level exceptions, prints to `stderr`, and exits with code 1 — individual insert functions should not catch and swallow.

## Docstrings

Every module starts with a triple-quoted module docstring on line 1 describing what the module does and how to run it (if it is a script). Functions do not need docstrings if their name and type signature are self-explanatory, but add one when behaviour is non-obvious.

## Data integrity

The pipeline writes deterministically from JSON source files. No insert function should read from the filesystem; data is loaded once in `build_db.py` and passed down. Tiered insertion order (sources → foods → animals/plants → relations → normalized) must be preserved — violating foreign-key order causes silent SQLite corruption when `PRAGMA foreign_keys = OFF`.

## Schema alignment

Field names in the pipeline's `TypedDict` types must stay in sync with the SQL schema in `data/sql/schema.sql` and `schema-normalized.sql`. The schema is owned by the `db-schema` agent — treat it as read-only and flag any mismatch rather than patching around it in Python.
