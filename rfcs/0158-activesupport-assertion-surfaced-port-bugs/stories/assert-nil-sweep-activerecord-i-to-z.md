---
title: "assert-nil-sweep-activerecord-i-to-z"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assert-nil-helper-sweep-remaining-packages` swept every package outside
activerecord (arel, globalid, rack-test, actionview, activesupport, trailties,
actionpack) onto `assertNil` / `assertNotNil`
(`packages/activesupport/src/testing/assertions.ts`, re-exported from
`@blazetrails/activesupport`). Rails' `assert_nil` is Minitest's, and
`assert_not_nil` is the `refute_nil` alias at
`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:244`.
`expect(x).not.toBeNull()` passes on `undefined`, which is the miss
`assert_not_nil` exists to catch.

Method used there, repeat it here: run `pnpm parity:test --json`, then pair each
TS test in `scripts/test-compare/output/ts-tests.json` (non-`.trails` files)
that carries `toBeNull` / `not:toBeNull` kinds with the Rails test of the same
normalized description in `rails-tests.json`. Swap every site in a test whose
`toBeNull` / `not:toBeNull` counts equal the Rails test's `assert_nil` /
`assert_not_nil` counts. Where the counts differ, read the Rails body and swap
only the lines that port an `assert_nil`. Leave TS tests with no Rails
counterpart alone. The comparer scores `toBeNull` as `nil` and `not:toBeNull`
as `notNil` (`scripts/test-compare/assertion-kinds.ts:52,171`), the same kinds
as `assertNil` / `assertNotNil`, so the swap is count/kind/value neutral. The
sibling PR confirmed this with an A/B of `convention-comparison.json` totals.

This story covers activerecord's test files whose path under `src/` starts with `i`–`z` (other than `connection-adapters/**`): 284 sites whose test count-matches Rails, as of 2026-09-30. Recount; the list is a guide, not a contract:

- `packages/activerecord/src/inheritance.test.ts` (6)
- `packages/activerecord/src/insert-all.test.ts` (24)
- `packages/activerecord/src/instrumentation.test.ts` (1)
- `packages/activerecord/src/integration.test.ts` (2)
- `packages/activerecord/src/locking.test.ts` (10)
- `packages/activerecord/src/migration.test.ts` (8)
- `packages/activerecord/src/migration/change-schema.test.ts` (2)
- `packages/activerecord/src/migration/column-attributes.test.ts` (1)
- `packages/activerecord/src/migration/columns.test.ts` (5)
- `packages/activerecord/src/mixin.test.ts` (4)
- `packages/activerecord/src/multiparameter-attributes.test.ts` (12)
- `packages/activerecord/src/multiple-db.test.ts` (2)
- `packages/activerecord/src/nested-attributes.test.ts` (12)
- `packages/activerecord/src/normalized-attribute.test.ts` (1)
- `packages/activerecord/src/null-relation.test.ts` (3)
- `packages/activerecord/src/persistence.test.ts` (40)
- `packages/activerecord/src/primary-keys.test.ts` (8)
- `packages/activerecord/src/query-cache.test.ts` (4)
- `packages/activerecord/src/quoting.test.ts` (1)
- `packages/activerecord/src/reflection.test.ts` (5)
- `packages/activerecord/src/relation.test.ts` (7)
- `packages/activerecord/src/relation/select.test.ts` (4)
- `packages/activerecord/src/relation/update-all.test.ts` (2)
- `packages/activerecord/src/relations.test.ts` (16)
- `packages/activerecord/src/schema-dumper.test.ts` (2)
- `packages/activerecord/src/scoping/default-scoping.test.ts` (3)
- `packages/activerecord/src/scoping/relation-scoping.test.ts` (4)
- `packages/activerecord/src/secure-password.test.ts` (6)
- `packages/activerecord/src/secure-token.test.ts` (2)
- `packages/activerecord/src/serialization.test.ts` (4)
- `packages/activerecord/src/serialized-attribute.test.ts` (4)
- `packages/activerecord/src/signed-id.test.ts` (8)
- `packages/activerecord/src/statement-cache.test.ts` (2)
- `packages/activerecord/src/store.test.ts` (7)
- `packages/activerecord/src/tasks/database-tasks.test.ts` (3)
- `packages/activerecord/src/time-precision.test.ts` (2)
- `packages/activerecord/src/timestamp.test.ts` (5)
- `packages/activerecord/src/token-for.test.ts` (11)
- `packages/activerecord/src/transaction-callbacks.test.ts` (9)
- `packages/activerecord/src/transactions.test.ts` (27)
- `packages/activerecord/src/type/integer.test.ts` (1)
- `packages/activerecord/src/validations/uniqueness-validation.test.ts` (1)
- `packages/activerecord/src/view.test.ts` (3)

## Acceptance criteria

- [ ] Every `toBeNull` / `.not.toBeNull()` in the files above that ports a Rails `assert_nil` / `assert_not_nil` uses `assertNil` / `assertNotNil` from `@blazetrails/activesupport`.
- [ ] `pnpm parity:test:assertions` stays OK, and the per-package assertion/kind/value mismatch totals in `convention-comparison.json` are unchanged.
