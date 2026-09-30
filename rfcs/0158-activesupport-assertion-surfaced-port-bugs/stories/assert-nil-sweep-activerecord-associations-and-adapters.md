---
title: "assert-nil-sweep-activerecord-associations-and-adapters"
status: ready
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

This story covers activerecord's `associations/**`, `adapters/**` and `connection-adapters/**`: 272 sites whose test count-matches Rails, as of 2026-09-30. Recount; the list is a guide, not a contract:

- `packages/activerecord/src/adapters/abstract-mysql-adapter/charset-collation.test.ts` (2)
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts` (5)
- `packages/activerecord/src/adapters/postgresql/bit-string.test.ts` (2)
- `packages/activerecord/src/adapters/postgresql/bytea.test.ts` (4)
- `packages/activerecord/src/adapters/postgresql/composite.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/domain.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/enum.test.ts` (2)
- `packages/activerecord/src/adapters/postgresql/foreign-table.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/geometric.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/hstore.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/interval.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/network.test.ts` (6)
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts` (8)
- `packages/activerecord/src/adapters/postgresql/quoting.test.ts` (1)
- `packages/activerecord/src/adapters/postgresql/range.test.ts` (10)
- `packages/activerecord/src/adapters/postgresql/uuid.test.ts` (9)
- `packages/activerecord/src/adapters/postgresql/xml.test.ts` (1)
- `packages/activerecord/src/adapters/sqlite3/copy-table.test.ts` (5)
- `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` (2)
- `packages/activerecord/src/adapters/sqlite3/virtual-column.test.ts` (1)
- `packages/activerecord/src/associations/belongs-to-associations.test.ts` (33)
- `packages/activerecord/src/associations/bidirectional-destroy-dependencies.test.ts` (2)
- `packages/activerecord/src/associations/cascaded-eager-loading.test.ts` (1)
- `packages/activerecord/src/associations/eager-load-includes-full-sti-class.test.ts` (4)
- `packages/activerecord/src/associations/eager-load-nested-include.test.ts` (2)
- `packages/activerecord/src/associations/eager.test.ts` (13)
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` (4)
- `packages/activerecord/src/associations/has-many-associations.test.ts` (25)
- `packages/activerecord/src/associations/has-many-through-associations.test.ts` (8)
- `packages/activerecord/src/associations/has-one-associations.test.ts` (25)
- `packages/activerecord/src/associations/has-one-through-associations.test.ts` (20)
- `packages/activerecord/src/associations/has-one-through-disable-joins-associations.test.ts` (2)
- `packages/activerecord/src/associations/inverse-associations.test.ts` (31)
- `packages/activerecord/src/associations/join-model.test.ts` (10)
- `packages/activerecord/src/connection-adapters/connection-handler.test.ts` (8)
- `packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts` (11)
- `packages/activerecord/src/connection-adapters/merge-and-resolve-default-url-config.test.ts` (1)
- `packages/activerecord/src/connection-adapters/schema-cache.test.ts` (8)

## Acceptance criteria

- [ ] Every `toBeNull` / `.not.toBeNull()` in the files above that ports a Rails `assert_nil` / `assert_not_nil` uses `assertNil` / `assertNotNil` from `@blazetrails/activesupport`.
- [ ] `pnpm parity:test:assertions` stays OK, and the per-package assertion/kind/value mismatch totals in `convention-comparison.json` are unchanged.
