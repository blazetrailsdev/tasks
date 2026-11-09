---
title: "plan-test-moves --apply rewrites moved files' relative specifiers"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/plan-test-moves.ts --apply` moves test files but leaves their relative import specifiers pointing at the old location. RFC 0223's "What a package PR does" step 2 requires the specifiers in the move commit, because the pre-commit `eslint --fix` (`no-unnecessary-type-assertion`) strips casts from files whose imports don't resolve. Every package PR therefore rewrites specifiers by hand or with an ad-hoc script. trails#9803 used a throwaway script for 151 specifiers across 12 packages. The script re-resolved each relative specifier from the file's old path, mapped the target through the move table (`.js` ↔ `.ts`), and re-relativized it from the new path. These forms all need handling: `from`, bare side-effect `import "…"`, `import(…)`, `declare module "…"`, `vi.mock` / `vi.doMock` / `vi.doUnmock` / `vi.importActual`. The script's first pass missed side-effect imports and `declare module` (fugit's `spec-helper.ts`), which typecheck caught.

## Acceptance criteria

- [ ] `plan-test-moves <pkg> --apply` rewrites every relative specifier in each moved file (all forms above) to resolve to the same target after the move, including targets that moved in the same apply.
- [ ] A unit test in `scripts/layout/plan-test-moves.test.ts` covers a moved test importing a library file, a moved helper, a side-effect import and a `declare module` augmentation.
- [ ] A dry run (no `--apply`) still prints only the table.
