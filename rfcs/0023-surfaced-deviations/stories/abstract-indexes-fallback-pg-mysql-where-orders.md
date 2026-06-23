---
title: "Abstract fallback indexes() pg/mysql arms omit where/orders at runtime"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-23T12:17:39Z"
assignee: "abstract-indexes-fallback-pg-mysql-where-orders"
blocked-by: null
---

## Context

PR #3972 widened the abstract `SchemaStatements#indexes()` return type (and
`IntrospectedIndex`) to surface `where?: string` and
`orders?: Record<string, string> | string`, matching Rails' `IndexDefinition`.
The type is now universal, but at runtime only the **sqlite** arm of the
abstract fallback actually populates these fields (it delegates to the canonical
`sqliteIndexes`, which recovers WHERE/DESC from the index SQL).

The `postgres` and `mysql` arms of the abstract fallback
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
~:1098 and ~:1116) build their result objects from raw `pg_index` /
`SHOW INDEX` queries and return only `{name, columns, unique}` — `where` and
`orders` come back `undefined`. The added introspection test
(`schema-introspection.test.ts`) had to be gated with
`it.runIf(adapterType === "sqlite")` precisely because the PG/MySQL fallback
arms don't surface these fields.

Rails' real PG adapter (`postgresql/schema_statements.rb#indexes`) recovers
partial-index `where` (from `pg_get_expr(indpred, ...)`) and per-column
`orders` (from `indoption` DESC bits); the MySQL adapter surfaces them too.
The concrete `PostgreSQLSchemaStatements.indexes()` override already returns the
full `PgIndexDefinition` shape — this gap is only in the abstract fallback arms,
which are the lower-fidelity portable path.

## Acceptance criteria

- [ ] Abstract fallback `indexes()` postgres arm populates `where` (partial
      predicate) and `orders` (per-column DESC directions) from `pg_index`
      metadata, matching Rails.
- [ ] Abstract fallback `indexes()` mysql arm populates `orders` (and `where`
      where applicable) from `SHOW INDEX` / information_schema.
- [ ] Un-gate the `schema-introspection.test.ts` where/orders assertion (or add
      per-adapter assertions) so it runs on all three adapters.
- [ ] api:compare / test:compare delta non-negative.
