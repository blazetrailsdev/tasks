---
title: "activerecord: move the first 28 TS-only tests in test-fixtures.test.ts to its .trails sibling"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8865
claim: "2026-10-13T18:38:39Z"
assignee: "activerecord-relocate-ts-only-tests-test-fixtures-part-1"
blocked-by: null
closed-reason: null
---

## Context

The convention is that a TS-only test lives in the `.trails.test.ts` sibling, so a Rails-named file holds only
Rails' tests. `packages/activerecord/src/test-fixtures.test.ts` holds 52 extras against the 4 tests of
`vendor/rails/v8.0.2/activerecord/test/cases/test_fixtures_test.rb` (its `TestFixturesTest` describe at
`test-fixtures.test.ts:801`). Every other top-level describe is TS-only. This story takes the first twelve,
`useFixtures` (`:118`) through `useFixtures reconciles the PK column against the schema` (`:437-469`), 28 tests
and about 350 lines. `test-fixtures.trails.test.ts` already exists and receives them.

Split out of `activerecord-relocate-ts-only-tests-root-part-1`, whose six files moved far more lines than its
650 LOC estimate (a moved test counts once as a deletion and once as an addition). That story shipped
`relation.test.ts`, `attributes.test.ts` and the five TS-only tests of `relations.test.ts`.

`pnpm parity:test` has no flag that lists a file's extras. To list them, print the unconsumed entries of `tsTests`
next to `const extra = tsTests.length - consumedTs.size` in `scripts/test-compare/compare.ts` locally (do not
commit it).

`eslint/no-explicit-any-test-exclude.json` exempts the Rails-named file but not a new `.trails.test.ts`
sibling, and that list is only-shrink: remove each `as any` in a moved test instead of adding a row.

## Acceptance criteria

- [ ] The 28 tests in the describes at `test-fixtures.test.ts:118-469` are in `test-fixtures.trails.test.ts`, unchanged apart from `any` removal, or deleted where one duplicates a test already in the sibling.
- [ ] `test_fixtures_test.rb` reports 24 extra or fewer in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
