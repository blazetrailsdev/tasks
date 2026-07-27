---
title: "Un-gate the cross-pool suites now that arunit2 is provisioned on every lane"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MultipleDbTest` (`packages/activerecord/src/multiple-db.test.ts:17`), the habtm
"alternate database" test
(`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts:1185`)
and `base-prevent-writes.test.ts`'s "preventing writes applies to all
connections in block" are all `skipIf(!isSqliteRun())`. The gate was added
because nothing provisioned a second named database on the PG/MySQL servers.

PR #5414 removed that reason: `provisionSecondDatabase`
(`packages/activerecord/src/support/setup-second-pool.ts`) issues `CREATE
DATABASE` through the primary connection on the PG/MySQL lanes and rebuilds the
arunit2 tables there, and `connect()` establishes the pool on every lane. Rails
runs all of these against two real databases with no adapter gate
(`vendor/rails/activerecord/test/cases/multiple_db_test.rb`).

The gates were left in place because #5414 could not verify the PG/MySQL lanes
beyond CI, and un-gating changes what the suites assert on two lanes at once.

## Acceptance criteria

- The three suites run on all three lanes, or each remaining gate names a
  concrete reason that is not "no second database exists".
- `MultipleDbTest`'s cross-pool assertions (`exception contains correct pool`,
  which needs `SELECT * FROM courses` on the entrants pool to raise) hold on PG
  and MySQL.
- Note the MySQL interaction: `adapter.test.ts`'s cross-database-select probe
  drops and re-provisions the arunit2 database mid-run.
