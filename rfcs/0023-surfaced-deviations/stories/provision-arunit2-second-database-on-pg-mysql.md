---
title: "arunit2 second database is dead code on PG/MySQL: no provisioning, MultipleDbTest sqlite-gated"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`resolveSecondDatabaseConfig` (`packages/activerecord/src/test-helpers/
arunit2-config.ts`) resolves an `arunit2` connection for all three lanes, but
the only runtime caller (`setupSecondPool`) is reached exclusively on sqlite:
`MultipleDbTest` is `describe.skipIf(!isSqliteRun())`, because nobody
provisions a second named database on the PG/MySQL servers. The file's own doc
comment says this is "tracked in its own story" — no such story exists
(searched `pnpm tasks list` for arunit/provision/multipledb/second-pool).

So Rails' two-database model (`ARTest.test_configuration_hashes` →
`ActiveRecord::Base.establish_connection :arunit` +
`ARUnit2Model.establish_connection :arunit2`,
`vendor/rails/activerecord/test/support/connection.rb:31-33`) is only half
live for us, and `MultipleDbTest` never exercises PG or MySQL.

PR #4961 made the PG/MySQL branches _correct_ — they now build from
sub-settings and carry `MYSQL_SOCK` / a socket-directory `PGHOST` — but they
remain dead code until provisioning exists.

Also note the names themselves are a trails shape: Rails declares `arunit` /
`arunit2` as real entries in `test/config.yml`, while we derive both by
suffixing the primary database name (`arunitDatabaseNames`). Worth deciding
whether they become first-class named connections in the `CONNECTIONS` table.

## Acceptance criteria

- The PG and MySQL template/global setup provision the derived `arunit2`
  database alongside the primary and its slots.
- `MultipleDbTest`'s `skipIf(!isSqliteRun())` gate is removed and the suite
  passes on all three lanes.
- Decide whether `arunit` / `arunit2` should be named connections in
  `test-connection-env.ts` rather than suffix-derived, and record the outcome.
