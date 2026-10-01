# Todo
DO NOT TOUCH THIS FILE AI


- final_score.rs has some unfamiliar rust either learn it or change it
- go through best practices, we have claude instructions in .claude and in best-practices


Fixing:
 1. Two copies of each default value. Every slider file has its own default (for example GreyWaterSlider.tsx:8 sets 25), and FoodTableDefaults.ts sets the same values again. If you
     change one and forget the other, they drift apart. The sliders should import from FoodTableDefaults.ts.


  2. Repeated boilerplate in the sliders. About 12 of the slider components are nearly identical, and so are the modals (19 lines each). One generic slider and one generic modal,
     driven by settings, would remove a lot of files.

  3. A dead placeholder. services/data-pipeline/src/calculations/eco_destruction.py points to computeEcoDestruction(), which no longer exists, so the whole calculations/ folder can
     go.

  4. A generated file that's committed. apps/web/app/_wasm-signal.ts is rewritten on every WASM rebuild, so your git status shows a change every time. It should be gitignored. The
     same probably applies to public/wasm_calculations_bg.wasm.d.ts.
  5. A file that's both ignored and committed. apps/api/appsettings.Development.json is listed in .gitignore but is still in git. Also, apps/api/.gitignore just repeats rules that are
     already in the root one.
  6. Outdated docs. best-practices/wasm-calculations.md says the Rust code "is a port of FoodTableCalculations.ts", but that file now only does display formatting.
     best-practices/web.md and .claude/agents/microservices/ui.txt describe a "7-file structure" that's also out of date. .claude/ and best-practices/ overlap a lot; your todo already
     notes this.
  7. Two ways the web app gets data. The main table fetches from the C# API, but the /foods pages open the SQLite files directly with sql.js. That's worth deciding on deliberately.
  8. Small stuff:
     - There's no README.
     - The lint script calls next lint, but ESLint isn't installed.
     - .claude/todos/*_done.txt and .claude/audit/ are old agent logs you could delete.


