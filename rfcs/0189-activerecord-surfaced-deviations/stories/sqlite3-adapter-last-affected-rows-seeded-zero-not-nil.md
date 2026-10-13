---
title: "SQLite3Adapter seeds _lastAffectedRows 0 where Rails sets nil, and affectedRows adds ?? 0"
status: draft
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#initialize` sets `@last_affected_rows = nil`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:125`).

trails seeds the field `_lastAffectedRows = 0`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:249`), typed
`number`, and `LibSQLRemoteAdapter`'s constructor copies that `0`
(`connection-adapters/libsql-remote-adapter.ts`, trails#8846).
`affectedRows` then reads `this._lastAffectedRows ?? 0`
(`connection-adapters/sqlite3/database-statements.ts:240`), a fallback the `0`
seed makes unreachable. Rails' `affected_rows`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:122-124`) returns
`@last_affected_rows` as it is.

## Converged shape

The field is `number | null`, seeded `null` in both constructors at Rails'
position, and `affectedRows` returns it with whatever Rails' body does and no
invented `?? 0`.

## Acceptance criteria

- [ ] `_lastAffectedRows` is seeded `null` in `SQLite3Adapter` and `LibSQLRemoteAdapter`.
- [ ] `affectedRows` matches Rails' body line for line.
- [ ] `parity:api:calls` and the sqlite3 adapter tests stay green.
