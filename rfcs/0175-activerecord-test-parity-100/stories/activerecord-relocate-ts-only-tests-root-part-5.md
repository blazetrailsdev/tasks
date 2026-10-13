---
title: "activerecord: clear the 21 TS-only extras in nine smaller Rails-named root test files"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8852
claim: "2026-10-13T11:42:24Z"
assignee: "activerecord-relocate-ts-only-tests-root-part-5"
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-relocate-ts-only-tests-root-part-2`, whose PR cleared 12 of that
story's files and stopped at the LOC ceiling: a moved test counts once as a deletion and once
as an addition, so the remaining extras did not fit in one PR.

`pnpm parity:test` still counts these TS-only extras in Rails-named root test files
(extras per file, with the line count of the test bodies as measured on main after that PR):

- `packages/activerecord/src/test-databases.test.ts`: 3 (73 lines)
- `packages/activerecord/src/delegated-type.test.ts`: 3 (58 lines)
- `packages/activerecord/src/touch-later.test.ts`: 3 (42 lines)
- `packages/activerecord/src/aggregations.test.ts`: 3 (35 lines)
- `packages/activerecord/src/connection-pool.test.ts`: 2 (35 lines)
- `packages/activerecord/src/active-record-schema.test.ts`: 2 (31 lines)
- `packages/activerecord/src/insert-all.test.ts`: 2 (30 lines)
- `packages/activerecord/src/cache-key.test.ts`: 2 (26 lines)
- `packages/activerecord/src/transactions.test.ts`: 1 (3 lines)

The per-test names are not printed by the report. `scripts/test-compare/compare.ts` computes
the count as `tsTests.length - consumedTs.size` after the per-file match loop, and index `i`
there is the index into that file's `testCases` in
`scripts/test-compare/output/ts-tests.json`, which carries each test's `line`. A throwaway
`console.error` of the unconsumed indices at that point lists every extra with its line.

The `transactions.test.ts` extra is not a test to move. It is the `it.skip` stub for
`test_after_current_transaction_commit_multidb_nested_transactions`
(`vendor/rails/v8.0.2/activerecord/test/cases/transactions_test.rb:80`), which is listed in
`scripts/parity/unported-files/unscoped.ts`. Rails defines it in
`module TransactionCallbacksTests` (`transactions_test.rb:14`), so the Rails manifest records
it with no ancestors, and the comparer's unported-stub lookup goes through `pathIndex` only
(`normPath(tc.ancestors, tc.description)`), which misses the stub under
`describe("TransactionTest")`. The fix is in the comparer's stub lookup, falling back to the
description index, not in the test file.

The two `insert-all.test.ts` extras depend on that file's local `DivergentPrimaryKeyBook`
class and adapter flags. `aggregations`, `connection-pool` and `insert-all` have
`.trails.test.ts` siblings; the rest do not.

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path, matched to Rails'
      name and path without renaming a Rails-named test; (b) a duplicate of a ported Rails
      test, deleted; or (c) TS-only, moved to the `.trails.test.ts` sibling.
- [ ] A moved test that used `as any` is retyped: the `.trails.test.ts` files are linted
      with `no-explicit-any` on, and the Rails-named files are not.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
