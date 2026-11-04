---
title: "unplaced-rails-classes-get-a-constant-table"
status: done
updated: 2026-11-04
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - lazy-adapter-files-carry-their-own-constant-tables
deps-rfc: []
est-loc: null
priority: null
pr: trails#9702
claim: "2026-11-04T01:58:14Z"
assignee: "unplaced-rails-classes-get-a-constant-table"
blocked-by: null
closed-reason: null
---

## Context

trails#9665 limited `constant-residue.json`'s `excluded` to walked exports that `placement` (`scripts/api-compare/class-paths.ts`) can seat. Before that change, about 950 keys sat in files outside every entry graph, and many of them are real Rails classes with `rails-api.json` rows: `connection-adapters/postgresql-adapter.ts::PostgreSQLAdapter` (`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`), `postgresql/oid/bit.ts::Bit`, `mysql/column.ts::Column`, `fixture-set/table-row.ts::TableRow`, `encryption/extended-deterministic-queries.ts::*`. No constant table seats these, so `rbModName` and `constGet` do not answer their Ruby path. The pre-#9665 `excluded` lists, in trails history at `bcb75d2022`, enumerate them.

## Acceptance criteria

- Each real Rails class in an unplaced activerecord lib file (adapters, `fixture-set/`, `encryption/`, `fixtures.ts`) is seated in a table, through a lazy/separate table like `LAZY_DIRS` or by joining the entry graph, so its Ruby path resolves.
- Ambiguous pairings (`Column`, `SchemaCreation`, `StatementPool` across adapters) are resolved by file.
- `pnpm parity:class-paths --check` stays green.
