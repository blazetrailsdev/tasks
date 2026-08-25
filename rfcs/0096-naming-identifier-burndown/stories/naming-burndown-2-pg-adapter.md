---
title: "Burn down the remaining 47 naming call-argument rows in PostgreSQL adapter and OID types"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 188
pr: 6386
claim: "2026-08-11T23:31:32Z"
assignee: "naming-burndown-2-pg-adapter"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in PostgreSQL adapter and OID types: **47 rows across 9 files**.

| Rows | File                                                                               |
| ---: | ---------------------------------------------------------------------------------- |
|   33 | `packages/activerecord/connection-adapters/postgresql-adapter.ts`                  |
|    3 | `packages/activerecord/connection-adapters/postgresql/oid/type-map-initializer.ts` |
|    2 | `packages/activerecord/connection-adapters/postgresql/oid/array.ts`                |
|    2 | `packages/activerecord/connection-adapters/postgresql/oid/point.ts`                |
|    2 | `packages/activerecord/connection-adapters/postgresql/oid/range.ts`                |
|    2 | `packages/activerecord/connection-adapters/postgresql/quoting.ts`                  |
|    1 | `packages/activerecord/connection-adapters/postgresql/database-statements.ts`      |
|    1 | `packages/activerecord/connection-adapters/postgresql/oid/uuid.ts`                 |
|    1 | `packages/activerecord/connection-adapters/postgresql/schema-creation.ts`          |

Representative rows (Ruby args → TS args):

- `connection-adapters/postgresql-adapter.ts#extractDefaultFunction` calling `has_default_function?`: Ruby `ref:defaultValue, ref:default` → TS `ref:defaultValue, ref:defaultExpr`
- `connection-adapters/postgresql-adapter.ts#buildStatementPool` calling `new`: Ruby `ref:this, ref:typeCastConfigToInteger` → TS `ref:client, ref:typeCastConfigToInteger`
- `connection-adapters/postgresql-adapter.ts#quoteDefaultExpression` calling `lookup_cast_type_from_column`: Ruby `ref:column` → TS `ref:c`
- `connection-adapters/postgresql-adapter.ts#renameTable` calling `clear_data_source_cache!`: Ruby `ref:toS` → TS `ref:oldName`
- `connection-adapters/postgresql-adapter.ts#renameTable` calling `clear_data_source_cache!`: Ruby `ref:toS` → TS `ref:newName`
- `connection-adapters/postgresql-adapter.ts#renameTable` calling `quote_table_name`: Ruby `ref:tableName` → TS `ref:oldName`
- `connection-adapters/postgresql-adapter.ts#renameTable` calling `pk_and_sequence_for`: Ruby `ref:newName` → TS `ref:renamedName`
- `connection-adapters/postgresql-adapter.ts#removeIndex` calling `extract_schema_qualified_name`: Ruby `ref:toS` → TS `ref:tableName`

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-2 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `pnpm parity:api:calls:args:report` (after
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` on a fresh `pnpm build`)
      shows the `naming` class down by the rows this story converged, and no
      new `shape` rows.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` and the touched packages' tests pass; no public API change.
