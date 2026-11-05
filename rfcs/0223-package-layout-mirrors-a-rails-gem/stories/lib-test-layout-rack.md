---
title: "Move rack to lib/ + test/"
status: ready
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [rack]
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

`packages/rack/src/` holds 69 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: the upstream gem's test/ (or spec/) tree as vendored under vendor/.
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commit 1 is `git mv packages/rack/src packages/rack/lib` alone; commit 2 is
      `scripts/layout/plan-test-moves.ts rack --apply`; commit 3 holds only
      import-specifier and path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/rack/lib/`; `packages/rack/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts rack` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for rack are exactly 0
      (matched and total); every ratchet gate is green with no mark edit.
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
