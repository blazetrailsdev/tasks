---
title: "Move tse-compiler to lib/ + test/"
status: draft
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [tse-compiler]
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

`packages/tse-compiler/src/` holds 5 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: test/ mirroring lib/ (no Ruby counterpart; RFC open question 2 must be settled first).
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commit 1 is `git mv packages/tse-compiler/src packages/tse-compiler/lib` alone; commit 2 is
      `scripts/layout/plan-test-moves.ts tse-compiler --apply`; commit 3 holds only
      import-specifier and path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/tse-compiler/lib/`; `packages/tse-compiler/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts tse-compiler` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for tse-compiler are exactly 0
      (matched and total); every ratchet gate is green with no mark edit.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
