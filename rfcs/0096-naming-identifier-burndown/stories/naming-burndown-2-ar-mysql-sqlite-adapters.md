---
title: "Burn down the remaining 15 naming call-argument rows in the MySQL and SQLite3 adapters"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
pr: 6433
claim: "2026-08-12T19:19:34Z"
assignee: "naming-burndown-2-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in the MySQL and SQLite3 adapters: **15 rows across 4 files**.

| Rows | File                                                                   |
| ---: | ---------------------------------------------------------------------- |
|    6 | `packages/activerecord/connection-adapters/abstract-mysql-adapter.ts`  |
|    4 | `packages/activerecord/connection-adapters/mysql/schema-statements.ts` |
|    4 | `packages/activerecord/connection-adapters/sqlite3-adapter.ts`         |
|    1 | `packages/activerecord/connection-adapters/mysql/schema-creation.ts`   |

Representative rows (Ruby args → TS args):

- `connection-adapters/abstract-mysql-adapter.ts#renameTable` calling `clear_data_source_cache!`: Ruby `ref:toS` → TS `ref:tableName`
- `connection-adapters/abstract-mysql-adapter.ts#renameTable` calling `clear_data_source_cache!`: Ruby `ref:toS` → TS `ref:newName`
- `connection-adapters/abstract-mysql-adapter.ts#buildChangeColumnDefaultDefinition` calling `new`: Ruby `ref:column, ref:default` → TS `ref:column, ref:default_`
- `connection-adapters/abstract-mysql-adapter.ts#changeColumnNull` calling `validate_change_column_null_argument!`: Ruby `ref:null` → TS `ref:null_`
- `connection-adapters/abstract-mysql-adapter.ts#changeColumnNull` calling `quote`: Ruby `ref:default` → TS `ref:default_`
- `connection-adapters/abstract-mysql-adapter.ts#caseSensitiveComparison` calling `new`: Ruby `ref:value` → TS `ref:quotedNode`
- `connection-adapters/mysql/schema-creation.ts#visitChangeColumnDefinition` calling `add_column_position!`: Ruby `ref:changeColumnSql, ref:columnOptions` → TS `ref:sql, ref:columnOptions`
- `connection-adapters/mysql/schema-statements.ts#indexes` calling `quote_column_name`: Ruby `ref:name` → TS `ref:c`

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
