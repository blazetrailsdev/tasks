---
title: "getModelColumns must exclude virtual (column-less) declared attributes from the eager-load SELECT projection"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 3713
claim: "2026-06-20T13:25:29Z"
assignee: "getmodelcolumns-excludes-virtual-attributes-in-eager-projection"
blocked-by: null
---

## Context

`JoinDependency`'s eager-load SELECT projection is built from
`getModelColumns(modelClass)`
(`packages/activerecord/src/associations/join-dependency.ts:45`), which prefers
`modelClass.columnsHash()` but falls back to `modelClass.columnNames()`. When the
schema cache for a joined model is only partially warmed, the column list
includes model-declared **virtual** attributes that have no backing DB column —
e.g. `Company.attribute("metadata", "json")`
(`packages/activerecord/src/test-helpers/models/company.ts:33`), where the
canonical `companies` schema (and the real Rails `companies` table) has no
`metadata` column.

The eager projection then emits `companies.metadata` and the query fails with
`no such column: companies.metadata`. Rails' eager SELECT projects only real
table columns, never virtual `attribute :x` declarations.

Surfaced while porting `test_attribute_alias_in_where_references_association_name`
in PR #3518: `Firm.includes("clients")...` over a partial
`{ companies: canonicalSchema.companies }` schema hit the error; the workaround
was to materialize the full `canonicalSchema` in that test's `beforeAll` so the
cache resolved `columnsHash` to DB-only columns. A correct `getModelColumns`
would make the partial-schema (and any cache-cold) path project DB columns only.

## Acceptance criteria

- [ ] `getModelColumns` projects only real DB columns for the eager-load SELECT,
      excluding model-declared virtual attributes that have no schema column,
      regardless of schema-cache warmth (matches Rails' eager projection).
- [ ] A regression test eager-loads a model with a declared virtual attribute
      (e.g. `Company.metadata`) over a partial schema and asserts the generated
      SQL does not reference the virtual column and the query succeeds.
- [ ] No canonical-schema or fixture changes required to work around the
      projection; revisit the PR #3518 Firm eager block to drop the full-schema
      workaround once fixed (optional cleanup).
