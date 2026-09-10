---
title: "Port fixtures_test.rb, tail (lines 1480-1847)"
status: ready
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "measure-fixtures-enrollment-gap"
  - "port-fixtures-test-cases-second-half"
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-fixtures-test-cases-second-half` by
`measure-fixtures-enrollment-gap`. After that story, these 29 are the last
missing cases in `vendor/rails/activerecord/test/cases/fixtures_test.rb`
(counterpart `packages/activerecord/src/fixtures.test.ts`). Measured on trails
`8f12d45ff`. None uses `Marshal` or ERB preprocessing.

## Missing cases

- `ActiveSupportSubclassWithFixturesTest` (1490): foo — with `fixtures :organizations`
  loaded, `organizations(:nsa)` equals `Organization.find_by_name("No Such Agency")`.
  A regression guard for fixture setup on an `ActiveRecord::TestCase` subclass
  that once called `nil[]` (`fixtures_test.rb:1486-1494`)
- `CustomNameForFixtureOrModelTest` (1508, 1513, 1520)
- `IgnoreFixturesTest` (1533, 1549)
- `FixturesWithDefaultScopeTest` (1560, 1565)
- `FixturesWithAbstractBelongsTo` (1573)
- `FixtureClassNamesTest` (1588)
- `SameNameDifferentDatabaseFixturesTest` (1596)
- `NilFixturePathTest` (1607)
- `FileFixtureConflictTest` (1627): ignores file fixtures
- `MultipleFixtureConnectionsTest` (1673, 1683, 1698, 1718, 1733)
- `CompositePkFixturesTest` (1761-1837): all 11 cases

## Exclusion candidate

`FileFixtureConflictTest` (1627) scans `fixture_paths` on disk for
`fixtures :all` and asserts on the `.yml` layout under `test/fixtures/all`.
Port it against the TS corpus if `fixtures :all` lands in the sibling story;
otherwise give it a case-level `tests:` exclusion with that reason.

## Acceptance criteria

- [ ] Every case above exists with the Rails name verbatim and passes on all three
      adapter lanes, or has a case-level `tests:` exclusion with a specific reason.
- [ ] Fixture sets come from the canonical corpus declared through
      `fixtures({ ... })`; no bespoke tables, no invented fixture rows.
- [ ] `pnpm parity:test -- --package activerecord` shows `fixtures_test.rb` missing
      at 0.

## Verification

`pnpm parity:test -- --package activerecord` from a trails checkout: the
`fixtures_test.rb` row reads `missing 0`, `misplaced 0`.
