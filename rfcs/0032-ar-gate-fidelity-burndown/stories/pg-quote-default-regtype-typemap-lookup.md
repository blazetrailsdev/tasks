---
title: "pg-quote-default-regtype-typemap-lookup"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5150
claim: "2026-07-23T14:34:37Z"
assignee: "pg-quote-default-regtype-typemap-lookup"
blocked-by: null
closed-reason: null
---

# PG quote_default_expression misses Rails' regtype OID type-map lookup

## Context

While porting `assert_queries_count` to the BulkAlterTableMigrationsTest
"changing columns" / "changing column null with default" tests
(`packages/activerecord/src/migration.test.ts`), running the vendored Rails
tests against PG showed Rails issues one extra SCHEMA query trails never does:

```text
SQL[SCHEMA]: SELECT 'character varying'::regtype::oid
```

Rails path: `schema_creation.visit_ChangeColumnDefinition`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb:102)
→ `quote_default_expression` → `lookup_cast_type(column.sql_type)` — the PG
type map is keyed by OID/short name, so the long form `character varying`
misses and `PostgreSQL::TypeMap` resolves it with a live
`SELECT '<sql_type>'::regtype::oid` query (see `lookup_cast_type` /
`load_additional_types` in
vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb).

trails' PG type map resolves `character varying` statically and never issues
that query, so its query counts for these bulk-alter paths are one lower than
Rails' (`migration_test.rb:1403` expects 3 on PG, trails emits 2;
`migration_test.rb:1433` expects 5, trails emits 4). The ported tests assert
trails' actual counts with a call-site comment referencing this gap.

## Acceptance criteria

- [ ] Determine whether trails' PG `lookupCastType` should converge on Rails'
      dynamic regtype resolution for sql_type strings missing from the static
      map (fidelity), or document the static map as a justified deviation at
      its definition site.
- [ ] If converged: the bulk-alter changing-columns tests' PG expected counts
      in `packages/activerecord/src/migration.test.ts` go back to Rails' 3/5
      and their deviation comments are removed.
