---
title: "layout-plan-test-moves-apply-registers-package-and-moves-non-ts"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

# plan-test-moves --apply registers the package and moves non-.ts test files

## Context

On trails#9794 (ruby-compat pilot), `pnpm layout:plan-test-moves ruby-compat --apply`
needed two hand fixes:

- `scripts/layout/package-roots.ts`'s doc says `--apply` adds the package to
  `LIB_TEST_PACKAGES` in the same commit. It does not, so
  `new Set<string>(["ruby-compat"])` was edited by hand.
- The walk (`walkTsFiles(libPath, COMMITTED_TS_FILES)`) lists only `.ts`, so
  `packages/ruby-compat/src/marshal.fixtures.{json,rb}`, read only by
  `marshal.trails.test.ts` via `new URL("./marshal.fixtures.json", import.meta.url)`,
  stayed in `lib/` and were `git mv`ed by hand beside the test.

## Acceptance criteria

- [ ] `--apply` rewrites `LIB_TEST_PACKAGES` in `scripts/layout/package-roots.ts`
      to include the package (sorted), so `package-roots.test.ts` is green right
      after the move.
- [ ] A non-`.ts` file under `lib/` that only test files reference by
      `new URL("./<name>", import.meta.url)` or a relative path string moves beside
      its (single) referencing test. A file referenced from more than one test
      directory, or from a library file, is FLAGGED and left in place.
- [ ] `plan-test-moves.test.ts` covers both arms.
