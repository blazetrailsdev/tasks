---
title: "Port fixtures_test.rb, second half (lines 954-1477)"
status: ready
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "measure-fixtures-enrollment-gap"
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured by `measure-fixtures-enrollment-gap` on trails `8f12d45ff`
(`pnpm parity:test -- --package activerecord`), after
`reenroll-fixtures-tests-stale-unported-exclusion` enrolled the file per case:

| Rails file                 | Rails | excluded | matched | missing | misplaced |
| -------------------------- | ----- | -------- | ------- | ------- | --------- |
| `fixtures_test.rb`         | 153   | 49       | 23      | 81      | 0         |
| `fixture_set/file_test.rb` | 14    | 1        | 13      | 0       | 0         |
| `test_fixtures_test.rb`    | 5     | 2        | 3       | 0       | 0         |

The first half (lines 41-952, PR #7652) and
`port-fixture-set-file-and-test-fixtures-cases` (PR #7655) are complete: every
one of the 81 missing cases sits at line 954 or later. None uses `Marshal`, and
none depends on ERB preprocessing — the ERB-bearing Rails fixture files
(`developers.yml`, `mateys.yml`, `pirates.yml`, …) are already rendered into the
TS corpus under `packages/activerecord/src/test-helpers/fixtures/`.

81 cases do not fit one PR, so the remainder is split at the class boundary at
`fixtures_test.rb:1480`. This story is lines 954-1477 (53 cases, 52 of them in the measured 81 — see below); lines
1480-1847 (29 cases) are `port-fixtures-test-cases-tail`.

## Missing cases (`vendor/rails/activerecord/test/cases/fixtures_test.rb`)

- `OverRideFixtureMethodTest` (963): fixture methods can be overridden
- `FixtureWithSetModelClassTest` (976, 980): uses fixture class defined in
  yaml; loads the associations to fixtures with set model class
- `SetFixtureClassPrevailsTest` (996): uses set fixture class
- `FixtureWithSetModelClassPrevailsOverNamingConventionTest` (1002): model
  class in fixture file is respected
- `CheckSetTableNameFixturesTest` (1018): table method
- `FixtureNameIsNotTableNameFixturesTest` (1030): named accessor
- `FixtureNameIsNotTableNameMultipleFixturesTest` (1042, 1046): named accessor
  of differently named fixture; named accessor of same named fixture
- `CustomConnectionFixturesTest` (1056, 1061) and
  `TransactionalFixturesOnCustomConnectionTest` (1071, 1076): leaky destroy; it
  twice in whatever order to check for fixture leakage
- `TransactionalFixturesOnConnectionNotification` (1085, 1108, 1136)
- `InvalidTableNameFixturesTest` (1180): raises error — genuinely unported
  (`fixtures.test.ts` has no such case), but test-compare does not report it
  missing: the bare name `raises error` credits against
  `adapters/mysql2/mysql2-rake.test.ts`'s `MysqlDBCreateWithInvalidPermissionsTest`.
  So it is outside the measured 81 and porting it does not move `missing`
- `CheckEscapedYamlFixturesTest` (1194): proper escaped fixture
- `ManyToManyFixturesWithClassDefined` (1203): this should run cleanly
- `FixturesBrokenRollbackTest` (1223): no rollback in teardown unless
  transaction active
- `LoadAllFixturesTest` / `LoadAllFixturesWithArrayTest` /
  `LoadAllFixturesWithPathnameTest` (1238, 1251, 1264): all there
- `FasterFixturesTest` (1286): cache
- `FoxyFixturesTest` (1314-1477): all 29 cases

## Exclusion candidates

The three `all there` cases scan `fixture_paths` directories on disk for
`fixtures :all` (`fixtures_test.rb:1238-1275`) and assert on the `.yml` layout
under `test/fixtures/all`, the same missing surface as the existing
`fixtures_test.rb` YAML-path row in `scripts/parity/unported-files/unscoped.ts`.
Try porting `fixtures :all` against the TS corpus first; exclude them case by
case, with that reason, only if it cannot be made to work. The fourth such case,
`FileFixtureConflictTest` (1627), is in the tail story.

## Acceptance criteria

- [ ] Every case above exists with the Rails name verbatim and passes on all three
      adapter lanes, or has a case-level `tests:` exclusion with a specific reason
      (never an `it.skip` stub).
- [ ] Fixture sets come from the canonical corpus declared through
      `fixtures({ ... })`; no bespoke tables, no invented fixture rows.
- [ ] `pnpm parity:test -- --package activerecord` shows `fixtures_test.rb` missing
      down from 81 to 29 (the tail story's cases).

## Verification

`pnpm parity:test -- --package activerecord` from a trails checkout: the
`fixtures_test.rb` row reads `missing 29`, `misplaced 0`.
