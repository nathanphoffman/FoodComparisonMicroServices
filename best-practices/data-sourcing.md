# Best practices — services/data-sourcing (Python / Playwright)

## Naming

Use `snake_case` for everything except class names, which use `PascalCase`. Names spell things out completely — no abbreviations, no acronyms, no single-letter variables anywhere including comprehension expressions. Write `source_url` not `u`, `page_timeout_milliseconds` not `timeout_ms`, `domain_name` not `dom`. The only exceptions are domain-standard terms like `id`, `url`, and `db`. Module-level constants use `SCREAMING_SNAKE_CASE`. Private or transitional state fields on dataclasses use a leading underscore (e.g. `_status`), matching the existing `Source._status` convention.

## Type annotations

Every function must have type annotations on all parameters and the return value. Use `dataclass` (not `TypedDict`) for mutable stateful objects like `Source` and `Counts`. Use `dict[str, float]` for domain-typed mappings (e.g. hostname-to-timestamp) rather than bare `dict`. Import `Optional` only if needed for Python < 3.10 compatibility; prefer `X | None` otherwise.

## Async patterns

All I/O goes through `asyncio` and Playwright's async API. Synchronous blocking calls inside an `async` function are a violation — use `asyncio.sleep` for delays, not `time.sleep`. The `_run()` coroutine is the async entry point; `main()` is its thin synchronous wrapper that calls `asyncio.run(_run())`. Do not introduce threading.

## Rate limiting and politeness

Domain-level rate limiting (`wait_for_domain_cooldown`) is not optional. Any new download path must go through the same per-domain delay logic before fetching. `DOMAIN_DELAY_SECONDS` and `PAGE_TIMEOUT_MS` are the single source of truth — do not inline numeric literals for delays or timeouts.

## Functions and files

Prefer more, smaller functions and more, smaller files over large ones. A function that does two things should be two functions. Functions over roughly 20 lines should be broken into named async helpers. Keep I/O and data transformation completely separate: functions that compute a path or sanitise a filename must not also perform network I/O. `download.py` is currently the only module; if a second concern emerges (e.g. PDF parsing, deduplication), extract it to its own module rather than growing `download.py`.

## Paths and constants

All paths derive from `Path(__file__).resolve().parents[N]`. `ROOT`, `SOURCES_JSON`, and `OUTPUT_DIR` are the only path constants — new file-system references follow the same pattern, never hardcoded strings.

## Error handling

Network failures are caught per-source inside `process_sources`, logged with the source identifier, and counted in `Counts.failed` — they never abort the entire run. Do not catch `Exception` at a scope wider than a single source iteration. Exit codes and summary statistics are printed at the end; the caller decides what to do with the result.

## Regex

Avoid regex entirely when string methods or explicit character checks would be clearer — which is almost always. When regex truly is the right choice, assign it to a named module-level constant (as `FORBIDDEN_CHARS` already is) and include a comment in plain English explaining exactly what the pattern matches, what it rejects, and why no named alternative was used. Never inline a regex literal inside a function.

## Idempotency

The downloader skips files that already exist on disk. New download logic must preserve this behaviour — re-downloading and overwriting an existing file is a violation unless the user explicitly requests a refresh mode.
