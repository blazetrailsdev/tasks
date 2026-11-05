---
title: "Move activerecord-cli to lib/ + test/"
status: draft
updated: 2026-11-05
rfc: "0000-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [activerecord-cli]
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

`packages/activerecord-cli/src/` holds 31 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: test/ mirroring lib/ (no Ruby counterpart; RFC open question 2 must be settled first).
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commit 1 is `git mv packages/activerecord-cli/src packages/activerecord-cli/lib` alone; commit 2 is
      `scripts/layout/plan-test-moves.ts activerecord-cli --apply`; commit 3 holds only
      import-specifier and path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/activerecord-cli/lib/`; `packages/activerecord-cli/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts activerecord-cli` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for activerecord-cli are exactly 0
      (matched and total); every ratchet gate is green with no mark edit.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
