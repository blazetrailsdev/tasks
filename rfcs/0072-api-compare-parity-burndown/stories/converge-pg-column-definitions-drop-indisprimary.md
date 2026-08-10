---
title: "Converge PG column_definitions to Rails' ten fields; drop the is_primary 11th element"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6113
claim: "2026-08-05T02:15:00Z"
assignee: "converge-mysql-version-string-single-raise-site"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6097 (`route-pg-columns-through-new-column-from-field`). PG
`columns()` now delegates to `newColumnFromField` as Rails does
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:107`),
but one deviation had to ride along.

Rails' `column_definitions`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1034`)
selects **ten** columns, and `new_column_from_field`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:966-967`)
destructures exactly those ten. trails' PG `column_definitions` selects an
**eleventh**, `(i.indisprimary IS TRUE) AS is_primary`, and passes it as an
11th field-tuple element so `newColumnFromField` can set `primaryKey` on the
`Column`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
`columns()`, and the destructure in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
`newColumnFromField`).

It exists only because trails' schema dumper resolves a table's PK columns
from the per-column flag (`SchemaDumper#resolvePrimaryKeyColumns`,
`packages/activerecord/src/schema-dumper.ts:833`). Rails' PG dumper never
reads a per-column `primary_key` — it asks `primary_key(table_name)`.

## Converged shape

`resolvePrimaryKeyColumns`'s own JSDoc already invites the dialect override
("Dialects whose per-column flag can over-report … override this to consult
the authoritative primary key instead"), and MySQL already takes it. Override
it for PostgreSQL to consult `primaryKey(tableName)` / the existing
`primaryKeyOrderCache`, then:

- drop `indisprimary` and the `LEFT JOIN pg_index` from PG
  `column_definitions`,
- drop the 11th tuple element and the `isPrimary` local from
  `newColumnFromField`, restoring Rails' exact ten-element destructure,
- drop `primaryKey` from the PG `Column` options it feeds.

## Acceptance criteria

- [ ] PG `column_definitions` selects Rails' ten columns and no more.
- [ ] `newColumnFromField` destructures Rails' ten-element field tuple with no
      trailing trails-only element, and sets no `primaryKey`.
- [ ] PG schema dumps are unchanged (dumper suite + schema-dumper PG lane),
      including composite-PK tables and PK column ordering.
- [ ] `pnpm parity:api` non-negative; no new call-mismatch rows.
