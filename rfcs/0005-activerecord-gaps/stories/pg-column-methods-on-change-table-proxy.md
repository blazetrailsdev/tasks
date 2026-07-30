---
title: "pg-column-methods-on-change-table-proxy"
status: in-progress
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5624
claim: "2026-07-30T00:00:03Z"
assignee: "pg-column-methods-on-change-table-proxy"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping PR #5622 (`port-change-table-test-cases`, RFC 0005).

`PostgreSQL::ColumnMethods`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:6-...`)
is mixed into **both** `PostgreSQL::TableDefinition` and `PostgreSQL::Table`, so
inside a `change_table` block Rails exposes `t.uuid`, `t.jsonb`, `t.hstore`,
`t.inet`, `t.citext`, the range types, the geometric types, `t.serial` /
`t.bigserial`, `t.timestamptz`, `t.tsvector`, `t.enum`, and so on.

trails' `PostgreSQL::Table`
(`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:556`)
has none of them apart from `xml`, which #5622 added because
`change_table_test.rb` pins it. The full list already exists on
`PostgreSQL::TableDefinition` in the same file (`definedPgColumn`), so the port
is mechanical: forward each name to `Table#definedColumn` with the same
variadic `(...names, options)` overload pair #5622 introduced on the abstract
`Table`.

## Acceptance criteria

- Every type in Rails' `PostgreSQL::ColumnMethods` is reachable on
  `PostgreSQL::Table` with the variadic `*names` form.
- Coverage lands in the mirrored Rails test file for whatever pins each type;
  do not invent a trails-only companion suite for types Rails does not pin.
- `api:compare` / `test:compare` deltas non-negative; no bespoke tables.
