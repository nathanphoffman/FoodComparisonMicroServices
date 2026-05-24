# Best practices — apps/api (ASP.NET Core 9 / C#)

## Naming

Follow standard C# conventions: `PascalCase` for types, methods, properties, and constants; `camelCase` for local variables and parameters; `_camelCase` (leading underscore) for private fields. Names spell things out completely — no abbreviations, no acronyms, no single-letter variables. Write `connection` not `conn`, `configuration` not `config`, `emissionsPerKilogram` not `emPerKg`. The only exceptions are domain-standard terms like `id` and `db`. Avoid generic names like `data`, `result`, or `temp`.

## File and class size

Prefer more, smaller classes and more, smaller files over large ones. Each file holds one class. Classes over roughly 100 lines should be split by responsibility. Methods over roughly 20 lines should be broken into named private helpers. When a method does two things, make it two methods. The current three-folder layout — `Controllers/`, `Models/`, `Services/` — is the right grain; add a new folder only when a fourth distinct responsibility appears.

## Serialisation contract

C# property names are `PascalCase`. The API serialises to `snake_case` via `JsonNamingPolicy.SnakeCaseLower` in `Program.cs` — do not apply `[JsonPropertyName]` attributes to achieve the same thing, since the global policy handles it. Dapper column mapping uses `DefaultTypeMap.MatchNamesWithUnderscores = true`, so `SatFat` maps to `sat_fat` automatically; do not add manual column attribute mappings unless there is a genuine mismatch.

The snake_case JSON output must stay in sync with the TypeScript `RawFood` type in `apps/web/lib/types.ts` and the Rust `FoodRow` struct in `services/wasm-calculations/src/models.rs`. Renaming or adding a property requires coordinating across all three.

## SQL

SQL lives in `DbService.cs` as a raw string literal. Do not scatter queries across controllers or introduce an ORM — the schema is simple and Dapper with raw SQL is the right fit. When a query grows beyond roughly 30 lines, extract it to a named `private const string` at the top of the class rather than inlining it.

## Configuration

`DATA_DIR` and `DB_VERSION` come from `IConfiguration`, which reads from environment variables first, then `appsettings.{Environment}.json`. Do not hardcode paths. Local overrides go in `appsettings.Development.json`, which is gitignored.

## Error handling

Let unhandled exceptions propagate to the framework's default error middleware during development. In production, add a minimal `UseExceptionHandler` if needed, but do not swallow exceptions silently. Throw `InvalidOperationException` for configuration errors (missing DB, bad version), not generic `Exception`.

## Regex

Avoid regex entirely when string methods or explicit parsing would be clearer — which is almost always. When regex truly is the right choice, it must be assigned to a named `private const string` with a comment in plain English explaining exactly what it matches, what it rejects, and why no named alternative was used.

## No magic numbers

Every significant numeric constant gets a named `private const`. The pattern in `DbService.cs` (constructing the DB path from config, with a clear fallback) is the model to follow elsewhere.
