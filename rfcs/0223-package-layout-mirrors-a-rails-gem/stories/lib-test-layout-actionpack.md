---
title: "Move actionpack to lib/ + test/"
status: ready
updated: 2026-11-06
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [actionpack]
deps: [lib-test-layout-ruby-compat]
deps-rfc: []
est-loc: 940
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/actionpack/src/` holds 306 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: the gem's test/ tree under vendor/rails/v8.0.2/actionpack/test/.
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commits follow the RFC's "What a package PR does": commit 1 is
      `git mv packages/actionpack/src packages/actionpack/lib` with the package tsconfig
      and ESLint globs; commit 2 is `plan-test-moves actionpack --apply` with the
      moved tests' import specifiers; commit 3 holds only path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/actionpack/lib/`; `packages/actionpack/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts actionpack` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for actionpack are exactly 0
      (matched and total); every ratchet gate is green with no mark count change
      (a path-keyed mark row is re-keyed `src/` → `lib/` only).
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
