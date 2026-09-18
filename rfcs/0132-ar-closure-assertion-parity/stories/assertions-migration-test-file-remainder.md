---
title: "assertions-migration-test-file-remainder"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
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

`assertions-migration-test-file` converged ~45 of ~90 divergent tests in
`packages/activerecord/src/migration.test.ts` against
`vendor/rails/activerecord/test/cases/migration_test.rb`. The rest are listed
below (re-measured with `pnpm parity:test -- --package activerecord --assertions --missing`).
Shapes to copy are already in the converged tests in that file: `assertColumn` /
`assertNoColumn` from `test-helpers/test-case.ts`, `assertRaises`,
`assertNothingRaised`, `toBeTruthy()`/`toBeFalsy()`, a non-`assert*` same-file
function for adapter branches.

Remaining tests:

- add and remove index
- add drop table with prefix and suffix
- adding indexes
- adding multiple columns
- adding timestamps
- add table with decimals
- allows sqlite3 rollback on invalid column type
- bulk revert
- changing index
- check pending with stdlib logger
- copied migrations at timestamp boundary are valid
- copying migrations preserving magic comments
- copying migrations to empty directory
- copying migrations to non existing directory
- copying migrations without timestamps
- copying migrations without timestamps from 2 sources
- copying migrations with timestamps
- copying migrations with timestamps from 2 sources
- copying migrations with timestamps to destination with timestamps in future
- create table with force true does not drop nonexisting table
- create table with query
- create table with query from relation
- default functions on columns
- drop index by name
- drop index from table named values
- generate migrator advisory lock id
- invalid text size should raise
- migration raises if timestamp greater than 14 digits
- migration raises if timestamp is future date
- migrator generates valid lock id
- migrator one up with unavailable lock
- migrator one up with unavailable lock using run
- out of range binary limit should raise
- out of range integer limit should raise
- out of range text limit should raise
- removing columns
- removing index
- removing timestamps
- rename columns
- rename table with prefix and suffix
- skip is not called if migrations are from the same plugin
- skipping migrations
- updating auto increment
- with advisory lock closes connection
- with advisory lock raises the right error when it fails to release lock

## Acceptance criteria

- `migration_test.rb` reports 0 assertion-count, 0 assertion-kind and 0 assertion-value mismatches.
- Mark file stays frozen (no reseed, no hand edit); no test renames.
- A converged assertion failing on a production bug is parked `it.skip` with the structured annotation and a story filed in 0155.
