---
title: "Sweep activerecord a–h test files' toBeNull ports of assert_nil onto assertNil / assertNotNil"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 560
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

This story covers activerecord's test files whose path under `src/` starts with `a`–`h` (other than `associations/**` and `adapters/**`): 259 sites whose test count-matches Rails, as of 2026-09-30. Recount; the list is a guide, not a contract:

- `packages/activerecord/src/adapter.test.ts` (3)
- `packages/activerecord/src/aggregations.test.ts` (11)
- `packages/activerecord/src/associations.test.ts` (14)
- `packages/activerecord/src/attribute-methods.test.ts` (17)
- `packages/activerecord/src/attributes.test.ts` (2)
- `packages/activerecord/src/autosave-association.test.ts` (10)
- `packages/activerecord/src/base.test.ts` (19)
- `packages/activerecord/src/batches.test.ts` (1)
- `packages/activerecord/src/boolean.test.ts` (2)
- `packages/activerecord/src/calculations.test.ts` (10)
- `packages/activerecord/src/callbacks.test.ts` (1)
- `packages/activerecord/src/coders/json.test.ts` (2)
- `packages/activerecord/src/comment.test.ts` (6)
- `packages/activerecord/src/connection-pool.test.ts` (2)
- `packages/activerecord/src/counter-cache.test.ts` (1)
- `packages/activerecord/src/database-configurations/hash-config.test.ts` (5)
- `packages/activerecord/src/database-configurations/url-config.test.ts` (1)
- `packages/activerecord/src/database-statements.test.ts` (2)
- `packages/activerecord/src/date-time-precision.test.ts` (6)
- `packages/activerecord/src/date-time.test.ts` (5)
- `packages/activerecord/src/defaults.test.ts` (8)
- `packages/activerecord/src/delegated-type.test.ts` (6)
- `packages/activerecord/src/dirty.test.ts` (43)
- `packages/activerecord/src/disconnected.test.ts` (1)
- `packages/activerecord/src/dup.test.ts` (7)
- `packages/activerecord/src/encryption/encryptable-record.test.ts` (3)
- `packages/activerecord/src/encryption/encryption-schemes.test.ts` (1)
- `packages/activerecord/src/encryption/extended-deterministic-queries.test.ts` (2)
- `packages/activerecord/src/enum.test.ts` (9)
- `packages/activerecord/src/finder.test.ts` (41)
- `packages/activerecord/src/fixtures.test.ts` (18)

## Acceptance criteria

- [ ] Every `toBeNull` / `.not.toBeNull()` in the files above that ports a Rails `assert_nil` / `assert_not_nil` uses `assertNil` / `assertNotNil` from `@blazetrails/activesupport`.
- [ ] `pnpm parity:test:assertions` stays OK, and the per-package assertion/kind/value mismatch totals in `convention-comparison.json` are unchanged.
