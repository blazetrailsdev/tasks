---
title: "move-fixtures-test-ts-only-cases-to-trails-file"
status: ready
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
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

`packages/activerecord/src/fixtures.test.ts` carries 35 tests with no Rails
counterpart — `describe("fixtureId")`, `describe("effectiveFixtureKey")`,
`describe("ref")`, `describe("defineFixtures")`, `describe("HABTM fixture
reflection walking (trails)")` and `describe("FixtureSet (trails)")`. They are
good tests of trails-only surface (`ref()`, `effectiveFixtureKey`,
`resolveModelForTable`, `throughJoinTableNames`), and most of them drive a mock
adapter rather than the canonical schema.

They were invisible until `port-fixtures-test-cases-first-half` narrowed the
whole-file exclusion at `scripts/parity/unported-files/unscoped.ts` so
`fixtures_test.rb` is compared per case. `pnpm parity:test -- --package
activerecord` now reports `fixtures_test.rb … extra 35`, which is the repo
convention being broken in the open: a TS-only test belongs in the sibling
`*.trails.test.ts`, here `packages/activerecord/src/fixtures.trails.test.ts`
(14 lines today).

The move was deliberately not folded into the porting PR: it is ~600 LOC of
pure relocation (additions plus deletions both count), which would have carried
that PR past its ceiling and buried 21 ported cases in churn.

## Acceptance criteria

- The tests with no Rails counterpart move from
  `packages/activerecord/src/fixtures.test.ts` to
  `packages/activerecord/src/fixtures.trails.test.ts`, bodies unchanged.
- `pnpm parity:test -- --package activerecord` reports `extra 0` for
  `fixtures_test.rb`; `matched` and `missing` are unchanged.
- The mock-adapter helpers the moved tests need (`makeAdapter`,
  `makeModel`, `executedStatements`, `DOUBLE_ONLY_COLUMNS`) move with them, and
  `fixtures.test.ts` keeps only what its Rails-matched cases use.
- `pnpm parity:test:assertions` stays at or below its mark, and the activerecord
  suite is green on all three adapter lanes.
