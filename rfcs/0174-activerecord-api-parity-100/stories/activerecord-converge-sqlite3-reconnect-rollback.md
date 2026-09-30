---
title: "activerecord: SQLite3Adapter#reconnect calls the driver handle's rollback (call row)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/connection-adapters/sqlite3-adapter.json` — `reconnect` omits
`rollback`: `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:814` calls `@raw_connection.rollback` (the sqlite3
gem's handle method) when a transaction is open. trails' sqlite drivers (`packages/activerecord/src/sqlite/`)
wrap better-sqlite3 / node:sqlite / expo / libsql, none of which exposes `rollback` on the handle.
The gem-backed convention is to give the wrapped handle the gem's method.

## Acceptance criteria

- [ ] The trails sqlite3 driver wrapper exposes `rollback` (issuing `ROLLBACK` when in a transaction, as the gem's `Database#rollback` does), and `reconnect` calls it; row deleted; all sqlite driver lanes green.
