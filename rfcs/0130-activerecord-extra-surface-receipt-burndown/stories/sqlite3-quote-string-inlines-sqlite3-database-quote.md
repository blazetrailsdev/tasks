---
title: "SQLite3 quote_string inlines SQLite3::Database.quote"
status: draft
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Quoting#quote_string` is `::SQLite3::Database.quote(s)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:66-68`),
and `SQLite3::Database.quote` is `string.gsub("'", "''")`
(`vendor/sqlite3/lib/sqlite3/database.rb:112-114`). trails'
`quoteString` (`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`)
inlines that body, because the sqlite3 gem's `Database` class has no trails port
(the adapters talk to better-sqlite3 / node:sqlite drivers directly).

## Acceptance criteria

- `SQLite3::Database.quote` lives where the sqlite3 gem's `Database` is ported
  (or the driver layer that stands in for it), and `quoteString` calls it.
- The `@missingRailsCall quote — CONVERGEABLE` receipt is removed.
