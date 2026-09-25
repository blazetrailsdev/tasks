---
title: "postgresql-bulk-change-query-count-one-short"
status: blocked
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T02:04:15Z"
assignee: "port-ruby-method-arity-for-globalid-locator"
blocked-by: 'The missing PG query in both tests is Rails'' PostgreSQL#lookup_cast_type regtype round-trip: visit_ChangeColumnDefinition (postgresql/schema_creation.rb:98-104) calls quote_default_expression(default, ColumnDefinition); a ColumnDefinition does not respond_to?(:array?) so it takes super (abstract/quoting.rb:157-163), whose lookup_cast_type(column.sql_type) runs query_value("SELECT ...::regtype::oid", "SCHEMA") (postgresql/quoting.rb:194-197) — the ''one for columns'' query. trails'' lookupCastType resolves from the warmed _regtypeOids map with no query. That is exactly pg-lookup-cast-type-resolves-only-warmed-type-names (blocked: sync quoteDefaultExpression cannot await a regtype query). Unblocks when that story does.'
closed-reason: null
---

## Context

`BulkAlterTableMigrationsTest` "changing columns" and "changing column null with default"
(`vendor/rails/activerecord/test/cases/migration_test.rb:1404`, `:1435`) expect 3 and 5 queries on PostgreSQL with
`include_schema: true` ("one for columns, one for bulk change, one for comment" / "two for columns, one for bulk change, one for UPDATE, one for NOT NULL").
trails executes 2 and 4: the bulk `ALTER TABLE ... ALTER COLUMN` statement for the type/default changes runs, but one query Rails issues
(the column-comment query / a schema query) is missing.
Parked as `it.skip` in `packages/activerecord/src/migration.test.ts` (module-level `describeIfSupports("bulk_alter", ...)`).

## Acceptance criteria

- Identify the missing query against `postgresql/schema_statements.rb` `change_column_for_alter` / `change_column_comment` and converge it.
- The two tests are un-skipped with Rails' counts (3 and 5) and green on PG.
