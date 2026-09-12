---
title: "port-fixture-set-table-rows-instance-cases"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FixtureSet::TableRows` / `TableRow` / `ModelMetadata` are now ported as
`packages/activerecord/src/fixture-set/{table-rows,table-row,model-metadata}.ts`
(mirroring `vendor/rails/activerecord/lib/active_record/fixture_set/table_rows.rb`,
`table_row.rb`, `model_metadata.rb`), and `prepareModelFixtures` in
`packages/activerecord/src/fixtures.ts` builds its rows through
`new TableRows(tableName, { modelClass, fixtures }).toHash()`.

What is still missing is the per-set instance Rails calls it on:
`FixtureSet#table_rows` (`vendor/rails/activerecord/lib/active_record/fixtures.rb:742-751`)
is an instance method, and trails' `FixtureSet` in `fixtures.ts` is static-only. So the
three `fixtures_test.rb` cases that build a `FixtureSet` instance and compare
`#table_rows` (`vendor/rails/activerecord/test/cases/fixtures_test.rb:668,687,695`)
stay excluded by the case-level rows in `scripts/parity/unported-files/unscoped.ts`
(the reason string mentioning "compare #table_rows (fixtures_test.rb:668,687,695)").

## Acceptance criteria

- `FixtureSet` gains the instance surface `#table_rows` needs (`fixtures.rb:742-751`:
  `fixtures.except!(*ignored_fixtures)` then
  `TableRows.new(table_name, model_class:, fixtures:).to_hash`), delegating to the
  existing `fixture-set/table-rows.ts` port rather than re-deriving rows.
- The `fixtures_test.rb:668,687,695` cases are ported with their Rails names and the
  matching case-level exclusion rows in `unscoped.ts` are deleted.
- `pnpm parity:test` credits the three cases; no other test regresses.
