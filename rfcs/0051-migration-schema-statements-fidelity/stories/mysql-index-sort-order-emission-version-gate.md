---
title: "Version-gate MySQL index sort-order DDL emission (Rails super)"
status: ready
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 52
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #4377 (extend-defineschema-indexspec-and-converge-companies-index-dumps).

trails' MySQL index DDL emission applies the column sort `order` (`ASC`/`DESC`)
UNCONDITIONALLY, where Rails version-gates it. The MySQL SchemaCreation
(`packages/activerecord/src/connection-adapters/mysql/schema-creation.ts`,
`quotedColumns` ~298-309) calls the standalone
`addOptionsForIndexColumns` (`mysql/schema-statements.ts:340-356`), which appends
`${col} ${dir.toUpperCase()}` whenever `order` is present — it never consults
`supportsIndexSortOrder()` or `databaseVersion`, bypassing the generic
version-gated `SchemaStatements#addOptionsForIndexColumns`
(`abstract/schema-statements.ts:~2083-2092`) that PG rides.

Rails' `Mysql::SchemaStatements#add_options_for_index_columns`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:236`)
instead calls `super`, landing on the abstract version-gated implementation
(`abstract/schema_statements.rb:1639-1644`), then adds MySQL sub-part length on
top. So Rails is version-gated on the MySQL DDL-emission side (order dropped when
`supports_index_sort_order?` is false — MySQL < 8.0 / MariaDB < 10.8) where
trails' reimplementation is not.

Moot in most cases (an unsupported DB version ignores `DESC` in the DDL itself,
so reflection shows ascending regardless), but a genuine fidelity divergence.

## Acceptance criteria

- [ ] MySQL `addOptionsForIndexColumns` (or its SchemaCreation caller) applies
      sort order only when `supports_index_sort_order?` is true, routing through
      the shared version-gated path like Rails' `super`, while keeping MySQL
      sub-part length handling.
- [ ] api:compare / test:compare non-negative; no PG/SQLite regression.

## Notes

Distinct from the abstract-SchemaCreation sub-part-length-on-non-MySQL gap and
from the reconstruct-path sort-order round-trip gap
(`0048/mysql-reconstruct-index-sort-order-dump`).
