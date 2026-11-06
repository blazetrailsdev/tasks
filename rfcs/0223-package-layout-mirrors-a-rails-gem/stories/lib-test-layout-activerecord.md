---
title: "Move activerecord to lib/ + test/ (last)"
status: ready
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-migration
packages: [activerecord]
deps:
  [
    lib-test-layout-ruby-compat,
    lib-test-layout-activemodel,
    lib-test-layout-arel,
    lib-test-layout-activesupport,
    lib-test-layout-activerecord-cli,
  ]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/` holds 982 `*.test.ts` files at trails `b2e38a2ae5`.
Target test layout: test/cases, test/models, test/fixtures, test/schema, test/support, test/migrations, test/assets (vendor/rails/v8.0.2/activerecord/test/). Today's src/test-helpers/models and src/test-helpers/fixtures move to test/models and test/fixtures, src/test-helpers/test-schema.ts to test/schema, src/support to test/support; update the CLAUDE.md citations of those paths.
Procedure and rules: the RFC README's "What a package PR does" and "Where a
test lands".

## Acceptance criteria

- [ ] Commits follow the RFC's "What a package PR does": commit 1 is
      `git mv packages/activerecord/src packages/activerecord/lib` with the package tsconfig
      and ESLint globs; commit 2 is `plan-test-moves activerecord --apply` with the
      moved tests' import specifiers; commit 3 holds only path-string rewrites.
- [ ] No `*.test.ts`, `*.trails.test.ts` or test-only helper remains under
      `packages/activerecord/lib/`; `packages/activerecord/src/` no longer exists.
- [ ] `tsconfig.json` is `rootDir lib`, `include lib` with no test exclude;
      `tsconfig.test.json` covers `test/`; `dist/` file paths and
      `package.json` `exports` are unchanged.
- [ ] `scripts/layout/src-references.ts activerecord` prints nothing.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas for activerecord are exactly 0
      (matched and total); every ratchet gate is green with no mark count change
      (a path-keyed mark row is re-keyed `src/` → `lib/` only).
- [ ] Shipped testing modules stay in `lib/` behind their testing exports;
      `scripts/layout/server-path-closure.ts` adds no violation for this package.
- [ ] `git log --follow` reaches pre-move history for a sampled moved test.
- [ ] PR body states it is a mechanical move under CLAUDE.md's
      single-mechanical-rename exception to the LOC ceiling.
