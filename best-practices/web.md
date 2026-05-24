# Best practices — apps/web (Next.js 15 / React 19 / TypeScript)

## Naming

Names spell things out completely — no abbreviations, no acronyms, no single-letter variables (not even loop indices). Write `index` not `i`, `food` not `f`, `emissionsPerKilogram` not `emPerKg`. The only exceptions are universally understood technical terms like `id`, `url`, and `api`. Variables and functions communicate intent without comments, so avoid generic names like `data`, `result`, `temp`, or `value`. Use `camelCase` for variables and functions, `PascalCase` for files, classes, and types, and `SCREAMING_SNAKE_CASE` for constants.

## Style

Every statement ends with a semicolon. Use single quotes everywhere except inside JSX attributes. No inline styles — Tailwind only. No magic numbers; give every significant constant a named `const`. Never use array index as a React key in a list that can reorder; use the `slug` or `id` the data already provides.

## Regex

Avoid regex entirely when a named function, string method, or explicit parse would be clearer — which is almost always. Regex is a last resort, not a default tool. When regex truly is the right choice, it must be accompanied by a comment that explains in plain English exactly what the pattern matches, what it rejects, and why no named alternative was used instead.

## Functions and files

Prefer more, smaller functions and more, smaller files over large ones. A function that does two things should be two functions. A file that covers two concerns should be two files. Functions over roughly 20 lines should be broken into named helpers. Files over roughly 100 lines should be split by responsibility. When in doubt, extract — a well-named 5-line function is always better than an inline block with a comment. Each file exports one React component — the exception is a cohesive set of small, tightly related components (e.g. per-column cell renderers in `FoodTableFields.tsx`).

Prefer `const` over `let`. Use named exports only — no default exports except for Next.js page and layout files, where the framework requires it.

## TypeScript

Prefer `interface` over `type` alias for object shapes. Use `null` (not `undefined`) for intentionally absent values, matching the data layer's convention. Keep types co-located with the code that uses them; only promote to `app/types/` when a type is shared across two or more files.

## Data and API

The API returns snake_case JSON keys that intentionally mirror the TypeScript types in `lib/types.ts`. Do not rename or restructure these field names in TypeScript without coordinating with the C# `FoodRow` model and the Rust `FoodRow` struct. `lib/queries/commonFoods.ts` and `lib/db.ts` are the only places that should contain raw SQL — inline queries elsewhere are a violation.

## Component boundaries

`app/components/FoodTable/` has its own agent (`food-table`) with tighter constraints. Respect its 7-file structure, keep color functions in `FoodTableCalculations.ts`, and do not merge the per-column cell components into a single file.
