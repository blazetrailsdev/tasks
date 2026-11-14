---
title: "Move actionmailbox from src/ to lib/ + test/"
status: in-progress
updated: 2026-11-14
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10081
claim: "2026-11-14T07:11:49Z"
assignee: "lib-test-layout-actionmailbox"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionmailbox` still uses the colocated `src/` layout: 89 files, 25 of them `*.test.ts`. `tsconfig.json` sets `rootDir: "src"` and excludes `src/**/*.test.ts` and `src/test-helpers`. The package is not in `LIB_TEST_PACKAGES` (`scripts/layout/package-roots.mts`), and it is not among the `deps` of `lib-test-layout-retire-src-compat`. That story's no-`src/` Preflight guard therefore cannot land while this package keeps `src/`. The Rails layout to mirror is `vendor/rails/v8.0.2/actionmailbox/{lib,test}`. trails#10036 fixed `plan-test-moves`: it now moves directory symlinks as one entry and rewrites specifiers in files that stay.

## Acceptance criteria

- Run `pnpm tsx scripts/layout/plan-test-moves.ts actionmailbox --apply`: the library ends up in `lib/`, the tests in `test/` at their Rails paths, and the package is registered in `LIB_TEST_PACKAGES`.
- `tsconfig.json` and `package.json` exports point at `lib/`, and no test excludes remain.
- Add this story to the `deps` of `lib-test-layout-retire-src-compat`.
