---
title: "postgresql-bulk-change-query-count-one-short"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T02:04:15Z"
assignee: "port-ruby-method-arity-for-globalid-locator"
blocked-by: 'Re-triaged 2026-10-08. The missing query is PostgreSQL lookup_cast_type regtype round-trip, now ratified as permanent (CLAUDE.md § "Adapter facts are prewarmed and peeked"; pg-lookup-cast-type-resolves-only-warmed-type-names closed). So the PG query count will stay one short. Remaining work: the two tests at migration.test.ts:2393,2425 are skipped whole; run them with the PostgreSQL expected count receipted against that section, or show that only the PG arm differs. Not blocked on other work; needs that port.'
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
