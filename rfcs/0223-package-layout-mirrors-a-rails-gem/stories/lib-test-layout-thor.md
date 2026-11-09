---
title: "Move thor to lib/ + test/"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [thor]
deps: [lib-test-layout-ruby-compat]
deps-rfc: []
est-loc: 170
priority: null
pr: trails#9886
claim: "2026-11-08T21:20:26Z"
assignee: "lib-test-layout-globalid"
blocked-by: null
---

## Context

`packages/thor/src/` holds 49 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: the upstream spec/ tree's layout, placed under test/ (never spec/).
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commits follow the RFC's "What a package PR does": commit 1 is
      `git mv packages/thor/src packages/thor/lib` with the package tsconfig
      and ESLint globs; commit 2 is `plan-test-moves thor --apply` with the
      moved tests' import specifiers; commit 3 holds only path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/thor/lib/`; `packages/thor/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts thor` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for thor are exactly 0
      (matched and total); every ratchet gate is green with no mark count change
      (a path-keyed mark row is re-keyed `src/` → `lib/` only).
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
