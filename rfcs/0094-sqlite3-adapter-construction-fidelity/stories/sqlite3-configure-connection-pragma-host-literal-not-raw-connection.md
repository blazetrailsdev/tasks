---
title: "sqlite3-configure-connection-pragma-host-literal-not-raw-connection"
status: draft
updated: 2026-09-15
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#configureConnection` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) calls each `Pragmas` setter as
`Pragmas[setter].call({ execute: (sql) => this._rawConnection!.exec(sql) }, value)`.
Rails calls `@raw_connection.public_send("#{pragma}=", value)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:838-844`). The receiver is an `SQLite3::Database`, which includes `Pragmas` and defines `execute` itself (`sqlite3/lib/sqlite3/database.rb`).
Trails' `SqliteConnection` (`sqlite-adapter.ts`) only exposes `exec` / `pragma`, so an object literal stands in for the Database.

## Acceptance criteria

- [ ] The raw connection is the setter receiver: `SqliteConnection` gains the `execute` the gem's `Database` has, or mixes in `Pragmas`.
- [ ] `configureConnection` has no ad-hoc `{ execute }` host literal.
