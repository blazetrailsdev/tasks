---
title: "SQLite3Integer is seated by a plain assignment, not constSet"
status: done
updated: 2026-11-05
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#9754
claim: "2026-11-05T19:51:49Z"
assignee: "activerecord-reads-whose-import-edge-reorders-the-base-cycle"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1397` seats
`SQLite3Integer` with `constSet(SQLite3Adapter, "SQLite3Integer", SQLite3Integer)`.
Rails defines it as a nested class with no `const_set`:
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:486`
(`class SQLite3Integer < Type::Integer`). CLAUDE.md § "Call-time constant
resolution" allows `constSet` only where the ported body calls `const_set`.
trails#9687 converted every other connection-adapters seat and left this one.

## Acceptance criteria

- The seat is a plain `SQLite3Adapter.SQLite3Integer = SQLite3Integer`, typed by a static declaration on `SQLite3Adapter`.
- The unused `constSet` import is removed.
- `pnpm parity:class-paths` still reports `ActiveRecord::ConnectionAdapters::SQLite3Adapter::SQLite3Integer`.
