---
title: "SQLite3 adapter constructor connects eagerly, unlike Rails' lazy initialize"
status: draft
updated: 2026-07-31
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

`AbstractSQLite3Adapter`'s constructor calls `this.connect()` eagerly
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:419`), so
`new BetterSQLite3Adapter(path)` opens — and therefore **creates** — the database
file. Rails' `SQLite3Adapter#initialize`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:64-104`)
only expands the path and stores `@config`; the handle is opened lazily by
`connect`/`reconnect`.

Surfaced by PR #5757 (story
`abstract-database-exists-body-diverges-from-connect-rescue`): Rails' base
`self.database_exists?(config)` is `new(config).database_exists?`
(`abstract_adapter.rb:357-360`), which is safe there precisely because
`initialize` does not touch the file. In trails that inherited static would
answer `true` for every path — it creates the database it was asked about — so
`AbstractSQLite3Adapter` had to keep a config-reading `static databaseExists`
override (`sqlite3-adapter.ts:1504`) instead of inheriting the base. That
override is a deviation with no Rails counterpart and can only be dropped once
construction is lazy.

The eager connect also means any code that constructs a SQLite3 adapter to
inspect config (probes, dbconsole-shaped paths, tests) has a filesystem side
effect Rails does not have.

## Acceptance criteria

- `AbstractSQLite3Adapter`'s constructor does not open the driver handle;
  connection happens on first use / `connectBang()` / `reconnect()`, as in Rails.
- `static databaseExists` on `AbstractSQLite3Adapter` is deleted and the base
  `AbstractAdapter.databaseExists(config)` (`new(config).databaseExists()`) is
  inherited, with the sqlite3 instance override
  (`sqlite3_adapter.rb:135-137`) answering.
- `sqlite3_adapter_test.rb`'s `database_exists?` tests still pass through the
  class method, including
  `test_database_exists_returns_false_when_the_database_does_not_exist` (which
  must not create `non_extant_db`).
- Existing callers that rely on `isOpen` being true straight after construction
  are updated; green on all three lanes.
