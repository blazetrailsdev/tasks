---
title: "Abstract SchemaStatements#indexes() return type omits where/orders carried at runtime"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-23T11:27:40Z"
assignee: "abstract-indexes-return-type-omits-where-orders"
blocked-by: null
---

## Context

PR #3963 converged the abstract `SchemaStatements#indexes()` sqlite arm
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
~:1083) to delegate to the canonical `sqliteIndexes`
(`sqlite3/schema-statements.ts:108`), which returns the full Rails
`IndexDefinition` shape `{table, name, columns, unique, where?, orders}`.

The base `indexes()` return type was deliberately left as
`Array<{ name; columns; unique }>` and the shared result `as`-cast down to it,
because widening the base type to add `where?`/`orders?` broke the
`PostgreSQLSchemaStatements.indexes()` override (`PgIndexDefinition[]` is not
structurally assignable — `schema-statements-class.ts:107`,
`postgresql-adapter.ts:3941`). So `where`/`orders` are present at runtime but
invisible to the static type, and `IntrospectedIndex`
(`schema-introspection.ts:36`) carries `where?` but not `orders`.

## Acceptance criteria

- [ ] Reconcile the abstract `indexes()` return type (and `IntrospectedIndex`)
      so `where?`/`orders?` are statically visible, OR document why the cast is
      the faithful choice, converging `PgIndexDefinition` so the PG override
      stays assignable to a widened base type.
- [ ] No production behavior change; api:compare / test:compare delta
      non-negative.
