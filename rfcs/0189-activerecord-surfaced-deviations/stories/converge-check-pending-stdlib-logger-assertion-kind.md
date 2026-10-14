---
title: "Converge migration_test.rb's check-pending stdlib-logger assertion kind"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed in trails#7870 (1a0b8f4bab): origin/main migration.test.ts:2062-2066 "check pending with stdlib logger" now asserts via assertNothingRaised(...).'
---

## Context

Rails carries the same `CheckPending` smoke assertion in two files:

- `vendor/rails/activerecord/test/cases/migration_test.rb:1795-1802`
  (`test_check_pending_with_stdlib_logger`)
- `vendor/rails/activerecord/test/cases/migration/pending_migrations_test.rb:82-87`
  (`test_with_stdlib_logger`)

Both are `assert_nothing_raised { CheckPending.new(Proc.new { }).call({}) }`.

PR #7166 converged the `pending_migrations_test.rb` half onto
`.resolves.not.toThrow()`, the spelling `scripts/test-compare/assertion-kinds.ts:62-64`
folds onto `assert_nothing_raised`. Its twin in
`packages/activerecord/src/migration.test.ts` (`it("check pending with stdlib logger")`)
still reads `.resolves.toBeUndefined()`, which scores as a different assertion
kind — one row of the activerecord `assertion-kind-mismatch` count. It was left
alone because it sits inside its file's committed high-water mark and was out of
that PR's scope.

## Converged shape

`await expect(new CheckPending(async () => {}).call({})).resolves.not.toThrow();`
— identical to the `pending-migrations.test.ts` port of the same Rails
assertion.

## Acceptance criteria

- `migration.test.ts`'s "check pending with stdlib logger" asserts
  `.resolves.not.toThrow()`.
- `pnpm tsx scripts/test-compare/lint-assertion-mismatches.ts` stays green, and
  the activerecord `assertion-kind-mismatch` mark is narrowed by the row this
  retires (`scripts/test-compare/assertion-mismatch-mark.json` is only-shrink).
