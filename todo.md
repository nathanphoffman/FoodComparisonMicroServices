# Todo
DO NOT TOUCH THIS FILE AI


- final_score.rs has some unfamiliar rust either learn it or change it
- go through best practices, we have claude instructions in .claude and in best-practices
- look at the individual foods pages and foods api multiple passes have told me it is duped

Fixing
  2. Repeated boilerplate in the sliders. About 12 of the slider components are nearly identical, and so are the modals (19 lines each). One generic slider and one generic modal,
     driven by settings, would remove a lot of files.


Ok double check it is not needed and remove it
  3. A dead placeholder. services/data-pipeline/src/calculations/eco_destruction.py points to computeEcoDestruction(), which no longer exists, so the whole calculations/ folder can
     go.


Tell me more about what this file is in the first place
  4. A generated file that's committed. apps/web/app/_wasm-signal.ts is rewritten on every WASM rebuild, so your git status shows a change every time. It should be gitignored. The
     same probably applies to public/wasm_calculations_bg.wasm.d.ts.


Ok fix it, I guess we should remove the sub gitignore too?
  5. A file that's both ignored and committed. apps/api/appsettings.Development.json is listed in .gitignore but is still in git. Also, apps/api/.gitignore just repeats rules that are
     already in the root one.


Add the read me
  8. Small stuff:
     - There's no README.
     - The lint script calls next lint, but ESLint isn't installed.
     - .claude/todos/*_done.txt and .claude/audit/ are old agent logs you could delete.

