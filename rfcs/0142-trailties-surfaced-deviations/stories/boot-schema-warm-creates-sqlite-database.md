---
title: "trailties: boot-time schema-cache warm must not create a SQLite database"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailties' `toPrepare` schema-cache warm (`packages/trailties/lib/trailties/active-record.ts`,
`warmSchemaCache` / `pool.schemaReflection.loadAllBang(pool)`) opens a connection on
every pool in every env but test. On SQLite, connecting creates the database file
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:115-120`:
mkdir_p and open). So booting an app, `bin/trails db:create` included, creates
`storage/development*.sqlite3` before the task runs, and the task reports
"already exists". Rails never connects at boot
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb:145-185` avoids it on purpose).
This shows up in `multi_dbs_test.rb`'s `db:create and db:drop works on all databases for env`,
`db:setup:namespace works`, and the three `when database_tasks is false ...` tests
(see `trailties-test-rake-multi-dbs-part-3`).

## Converged shape

Booting must not create a database that does not exist. The warm must not open a
connection that would create the file. Check this against what Rails' lazy
first-touch would do (no connection until a model is used), and keep the ratified
warm for databases that already exist.

## Acceptance criteria

- [ ] Booting a fresh app and running `db:create` prints `Created database` for every config.
- [ ] Regression test that fails on the current main.
