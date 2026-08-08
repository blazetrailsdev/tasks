---
title: "schema-conn-adapters-carry-a-real-pool"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6212
claim: "2026-08-08T00:30:11Z"
assignee: "schema-conn-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

`support/schema-conn.ts:22-39` memoizes one deliberately-never-connected adapter
per dialect (`BetterSQLite3Adapter` / `PostgreSQLAdapter` / `Mysql2Adapter`) to
render DDL for a dialect the lane isn't running. Each carries the constructor's
`NullPool` seed (`abstract-adapter.ts:833`, mirroring
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:153`),
so `role` / `shard` / `inspect()` on one would read `undefined` where Ruby's
bare `@pool.role` (`abstract_adapter.rb:286-296`) raises `NoMethodError`.

Rails' own DDL-rendering tests hand `SchemaCreation.new` /
`TableDefinition#initialize` an `ActiveRecord::Base.lease_connection`, i.e. an
adapter from a real pool. A plain `ConnectionPool` is not a drop-in here: it
starts a `Reaper` and expects to open connections, and the whole point of this
helper is that the connection is never opened.

Blocks `abstract-adapter-role-shard-cast-hides-ruby-nomethoderror`, which cannot
delete the `(this.pool as ConnectionPool)` cast at `abstract-adapter.ts:1406-1416`
until every pool-less construction site is gone.

## Acceptance criteria

- [ ] `schemaConn()`'s adapters reach `role` / `shard` / `inspect()` through a
      real `ConnectionPool` (or the helper is retired in favour of a leased
      connection), without opening a server connection in a lane that isn't
      running that dialect.
- [ ] No test renamed; the DDL-rendering tests that consume `schemaConn` stay
      green on all lanes.
