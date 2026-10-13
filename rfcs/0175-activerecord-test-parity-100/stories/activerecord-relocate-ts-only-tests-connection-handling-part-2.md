---
title: "activerecord: move the 11 TS-only tests in connection-handling.test.ts's four non-Rails describes to its .trails sibling"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 560
priority: null
pr: trails#8864
claim: "2026-10-13T18:38:09Z"
assignee: "activerecord-relocate-ts-only-tests-connection-handling-part-2"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-handling.test.ts` holds 43 extras against the 10 tests of
`vendor/rails/v8.0.2/activerecord/test/cases/connection_handling_test.rb`. This story takes the 11 tests in the
four top-level describes that have no Rails class behind them, about 270 lines:

- `withRoleAndShard loads Relation return values within scope (Story K gap 5)` (`connection-handling.test.ts:570-653`), 5 tests
- `AbstractAdapter#isPreventingWrites stack matching` (`:655-743`), 3 tests
- `resolveConfigForConnection / connectsTo with unset configurations` (`:745-810`), 2 tests
- `establish_connection accepts a DatabaseConfig` (`:812-839`), 1 test

`connection-handling.trails.test.ts` already exists and already has a `withRoleAndShard return value` describe
(`:102`) covering the same behaviour as the first block.

Split out of `activerecord-relocate-ts-only-tests-root-part-1`, whose six files moved far more lines than its
650 LOC estimate (a moved test counts once as a deletion and once as an addition). That story shipped
`relation.test.ts`, `attributes.test.ts` and the five TS-only tests of `relations.test.ts`.

`pnpm parity:test` has no flag that lists a file's extras. To list them, print the unconsumed entries of `tsTests`
next to `const extra = tsTests.length - consumedTs.size` in `scripts/test-compare/compare.ts` locally (do not
commit it).

`eslint/no-explicit-any-test-exclude.json` exempts the Rails-named file but not a new `.trails.test.ts`
sibling, and that list is only-shrink: remove each `as any` in a moved test instead of adding a row.

## Acceptance criteria

- [ ] The four describes are in `connection-handling.trails.test.ts`, and a test that duplicates one already in the sibling's `withRoleAndShard return value` describe is deleted, not moved.
- [ ] Together with `activerecord-relocate-ts-only-tests-connection-handling-part-1`, `connection_handling_test.rb` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
