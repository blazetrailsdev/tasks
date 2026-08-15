---
title: "sqlite3-virtual-tables-return-pairs"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6569
claim: "2026-08-15T16:15:07Z"
assignee: "sqlite3-virtual-tables-return-pairs"
blocked-by: null
closed-reason: null
---

# `virtual_tables` must return Rails' array-of-pairs, not a Record

## Context

Surfaced converging the `virtual_tables | exec_query` / `| cast_values`
call-set rows on `connection-adapters/sqlite3-adapter.ts` (RFC 0106 wave-3a).
That PR converged the CALLS — the body now runs
`execQuery(query, "SCHEMA").castValues()` over Rails' own query text — but left
the return shape alone because it is a separate, caller-visible change.

`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:297-307`:

    exec_query(query, "SCHEMA").cast_values.each_with_object({}) do |row, memo|
      table_name, sql = row[0], row[1]
      _, module_name, arguments = sql.match(VIRTUAL_TABLE_REGEX).to_a
      memo[table_name] = [module_name, arguments]
    end.to_a

The trailing `.to_a` makes the return value an ARRAY of `[table_name,
[module_name, arguments]]` pairs. trails
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts#virtualTables`)
returns the intermediate `Record<string, [string, string]>` instead — the hash
before `to_a`. `Sqlite3SchemaDumper` and any other reader consume the Record
shape, so flipping it is a multi-file change.

`VIRTUAL_TABLE_REGEX` also differs: Rails is `/USING\s+(\w+)\s*\((.+)\)/i`,
trails spells `/USING\s+(\w+)\s*\((.*)\)\s*$/is` inline rather than as a
file-level constant (sqlite3_adapter.rb:294).

## Acceptance criteria

- [ ] `virtualTables()` returns the array-of-pairs shape, mirroring
      sqlite3_adapter.rb:306's `.to_a`, and every reader is updated.
- [ ] `VIRTUAL_TABLE_REGEX` is a file-level constant matching Rails' pattern.
- [ ] SQLite lane green (virtual tables are SQLite-only); PostgreSQL and
      MySQL/MariaDB lanes green.
