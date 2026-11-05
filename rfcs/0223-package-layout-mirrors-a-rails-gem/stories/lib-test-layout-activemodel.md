---
title: "Move activemodel to lib/ + test/"
status: draft
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [activemodel]
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

`packages/activemodel/src/` holds 120 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: test/cases, test/models, test/validators (vendor/rails/v8.0.2/activemodel/test/).
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commit 1 is `git mv packages/activemodel/src packages/activemodel/lib` alone; commit 2 is
      `scripts/layout/plan-test-moves.ts activemodel --apply`; commit 3 holds only
      import-specifier and path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/activemodel/lib/`; `packages/activemodel/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts activemodel` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for activemodel are exactly 0
      (matched and total); every ratchet gate is green with no mark edit.
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
