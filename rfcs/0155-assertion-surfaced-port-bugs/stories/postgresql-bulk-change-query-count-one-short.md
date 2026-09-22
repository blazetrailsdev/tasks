---
title: "postgresql-bulk-change-query-count-one-short"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
