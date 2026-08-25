---
title: "converge-references-values-to-sql-literals"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6611
claim: "2026-08-16T20:53:32Z"
assignee: "converge-references-values-to-sql-literals"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-query-method-stores-with-values-and-references` (RFC
0106), which converged the `with_values` half of that story and left this one
because the change is a store-type migration across JoinDependency, not a body
edit — the two together blow the PR ceiling.

The live row is in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/query-methods.json`:

- `arel_column_with_table` (`order:quoteTableName,sql`). Rails' FIRST `Arel.sql`
  in that body is `self.references_values |= [Arel.sql(table_name, retryable: true)]`
  (query_methods.rb:1979). trails stores `referencesValues` as bare strings
  (`relation/query-methods.ts:248`, `arelColumnWithTable` at ~2100), and only
  auto-derived `SqlLiteral` references seed JoinDependency's alias map — see the
  host-interface comment in `relation/query-methods.ts`. Converging the store to
  hold `Arel.sql(..., { retryable: true })` literals retires the row.

Consumers to migrate alongside the store: `referencesEq`/`referencesValues`
readers in `relation.ts`, `merger.ts`'s `unionStrings`, `_manualReferences`, and
the JoinDependency alias-map seeding.

## Acceptance criteria

- [ ] `referencesValues` stores `Arel::Nodes::SqlLiteral` as Rails does, and
      `arel_column_with_table` calls `Arel.sql(tableName, { retryable: true })`.
- [ ] The `arel_column_with_table` `order:quoteTableName,sql` row is deleted by
      hand from its shard; stale mark fixed with `pnpm parity:api:calls:tighten`.
      No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
