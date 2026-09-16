---
title: "Converge FixtureSet.insert onto fixture_set.table_rows"
status: done
updated: 2026-09-16
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: trails#7843
claim: "2026-09-16T17:10:29Z"
assignee: "remove-legacy-time-ext-day-predicates"
blocked-by: null
closed-reason: null
---

## Context

Rails' `FixtureSet.insert` (`vendor/rails/activerecord/lib/active_record/fixtures.rb:665-694`) gets each set's rows from
`fixture_set.table_rows` (`:742-751`), which runs `TableRows` over the set's `Fixture` objects and, through
`TableRow`, mutates each fixture's hash in place (label → id, association labels → foreign keys).

trails (after trails#7765), `FixtureSet.insert` in `packages/activerecord/src/fixtures.ts` does not call `tableRows()`. It
re-prepares the raw rows through the trails-only `prepareModelFixtures` / `prepareJoinTableFixtures` (which resolve
`ref()` values, check the PK against the schema, and drop virtual columns), then writes the prepared row back onto
each `Fixture` (`fixture.fixture = row`) so `Fixture#find` sees the PK. For a `.yml`-path set it rebuilds the rows from
`fixture.toHash()`. `prepareModelFixtures`, `prepareJoinTableFixtures` and `PreparedFixtureSet` carry
`@noRailsEquivalent CONVERGEABLE` receipts.

## Converged shape

- `insert` builds `table_rows_for_connection` from `fixtureSet.tableRows()` with `unshift`, exactly as `fixtures.rb:676-680`.
- Whatever `prepareModelFixtures` does beyond Rails (the `ref()` resolution) lives in `TableRow` / `TableRows`
  (`fixture_set/table_row.rb`) instead, so fixture rows are mutated in place as Rails' are.
- The `rows` field on `PreparedFixtureSet` and the write-back loop in `insert` are deleted.

## Acceptance criteria

- `FixtureSet.insert` calls `tableRows()` and no longer calls `prepareModelFixtures` / `prepareJoinTableFixtures`.
- `fixtures.test.ts`, `test-fixtures.test.ts` and the encrypted-fixture tests stay green on all three adapter lanes.
