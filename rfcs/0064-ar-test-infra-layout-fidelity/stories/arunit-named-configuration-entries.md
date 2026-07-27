---
title: "arunit-named-configuration-entries"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
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

`ARTest.config`'s `expand_config` gives every connection in the `connections:`
hash three named entries — `arunit`, `arunit2` and
`arunit_without_prepared_statements`, each defaulted to a database name and the
connection's adapter (`vendor/rails/activerecord/test/support/config.rb:26-37`).
`ARTest.test_configuration_hashes` returns that whole hash
(`test/support/connection.rb:13-20`), `connect` assigns it to
`ActiveRecord::Base.configurations`, and then establishes **by name**:
`ActiveRecord::Base.establish_connection :arunit` and
`ARUnit2Model.establish_connection :arunit2` (`connection.rb:31-33`). Those
names are _environments_ in the configurations hash, with `primary` as the spec
name.

trails (`packages/activerecord/src/support/connection.ts`, after #5397)
synthesizes a single `HashConfig("test", "primary", …)` per connection, installs
only that entry, and establishes from the raw hash rather than by name. Result:
`Base.configurations` carries no `arunit` entry, and an ARTest-style
`Base.establishConnection("arunit")` does not resolve. The divergence is
recorded in a comment at `testConfigurationHashes`'s definition.

Raised in review on #5397; deferred there because the change does not fit that
PR's scope.

## Why it is its own story

Converging means renaming the environment every lookup in the harness uses —
`DatabaseTasks` (`databaseConfiguration`), `test-databases.ts:64` (`envName:
"test"`), `findDbConfig("test")`, `support/setup-second-pool.ts` — plus the
many tests that construct `new HashConfig("test", "primary", …)` directly.
`arunit2` additionally needs the `CREATE DATABASE` provisioning that exists only
on the sqlite lane today (`support/arunit2-config.ts` documents the PG/MySQL
branches as groundwork, and `MultipleDbTest` is `describe.skipIf(!isSqliteRun())`
for exactly this reason), so this likely wants sequencing with, or after, the
arunit2 un-gating work.

## Acceptance criteria

- `testConfigurationHashes` returns the selected connection's `arunit`,
  `arunit2` and `arunit_without_prepared_statements` entries, defaulted as
  `expand_config` defaults them (database name, and adapter falling back to the
  connection name with `sqlite3_mem` → `sqlite3`).
- `connect` assigns all of them to `Base.configurations` and establishes the
  primary pool by name (`establishConnection("arunit")`), mirroring
  `connection.rb:31-33`.
- `ARUnit2Model` establishes `arunit2` by name rather than from a derived URL,
  or the remaining gap is documented if arunit2 provisioning is still sqlite-only.
- The comment recording the divergence in `support/connection.ts` is deleted.
