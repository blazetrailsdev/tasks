---
title: "Move vitest-matchers to lib/ + test/"
status: draft
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [vitest-matchers]
deps: [lib-test-layout-ruby-compat]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/vitest-matchers/src/` holds 1 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: test/ mirroring lib/ (no Ruby counterpart).
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commit 1 is `git mv packages/vitest-matchers/src packages/vitest-matchers/lib` alone; commit 2 is
      `scripts/layout/plan-test-moves.ts vitest-matchers --apply`; commit 3 holds only
      import-specifier and path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/vitest-matchers/lib/`; `packages/vitest-matchers/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts vitest-matchers` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for vitest-matchers are exactly 0
      (matched and total); every ratchet gate is green with no mark edit.
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
