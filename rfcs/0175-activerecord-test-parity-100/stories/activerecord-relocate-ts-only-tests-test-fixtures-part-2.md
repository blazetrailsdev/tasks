---
title: "activerecord: move the last 24 TS-only tests in test-fixtures.test.ts to its .trails sibling"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 680
priority: null
pr: trails#8866
claim: "2026-10-13T18:40:02Z"
assignee: "activerecord-relocate-ts-only-tests-test-fixtures-part-2"
blocked-by: null
closed-reason: null
---

## Context

The convention is that a TS-only test lives in the `.trails.test.ts` sibling, so a Rails-named file holds only
Rails' tests. `packages/activerecord/src/test-fixtures.test.ts` holds 52 extras against the 4 tests of
`vendor/rails/v8.0.2/activerecord/test/cases/test_fixtures_test.rb` (its `TestFixturesTest` describe at
`test-fixtures.test.ts:801`). Every other top-level describe is TS-only. This story takes the last nine,
`useFixtures seeds composite-primary-key tables` (`:471`) through
`fixtures() pins every pool its sets seed through` (`:789-799`), 24 tests and about 330 lines.
`test-fixtures.trails.test.ts` already exists and receives them.

Split out of `activerecord-relocate-ts-only-tests-root-part-1`, whose six files moved far more lines than its
650 LOC estimate (a moved test counts once as a deletion and once as an addition). That story shipped
`relation.test.ts`, `attributes.test.ts` and the five TS-only tests of `relations.test.ts`.

`pnpm parity:test` has no flag that lists a file's extras. To list them, print the unconsumed entries of `tsTests`
next to `const extra = tsTests.length - consumedTs.size` in `scripts/test-compare/compare.ts` locally (do not
commit it).

`eslint/no-explicit-any-test-exclude.json` exempts the Rails-named file but not a new `.trails.test.ts`
sibling, and that list is only-shrink: remove each `as any` in a moved test instead of adding a row.

## Acceptance criteria

- [ ] The 24 tests in the describes at `test-fixtures.test.ts:471-799` are in `test-fixtures.trails.test.ts`, unchanged apart from `any` removal, or deleted where one duplicates a test already in the sibling.
- [ ] `makeAdapter`, `mockPool`, `makeModel` and `DOUBLE_ONLY_COLUMNS` are deleted from `test-fixtures.test.ts`, with every import only they used. Part 1 (trails#8865) copied them into the sibling because the describes this story moves still used them, and after it lands those describes sit 353 lines higher than the line numbers above.
- [ ] Together with `activerecord-relocate-ts-only-tests-test-fixtures-part-1`, `test_fixtures_test.rb` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
