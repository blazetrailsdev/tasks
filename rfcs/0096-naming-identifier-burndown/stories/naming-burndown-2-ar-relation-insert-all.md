---
title: "Burn down the remaining 21 naming call-argument rows in relation, query-methods and insert-all"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 84
pr: 6433
claim: "2026-08-12T19:19:34Z"
assignee: "naming-burndown-2-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in relation, query-methods and insert-all: **21 rows across 6 files**.

| Rows | File                                                  |
| ---: | ----------------------------------------------------- |
|    7 | `packages/activerecord/insert-all.ts`                 |
|    5 | `packages/activerecord/relation/query-methods.ts`     |
|    4 | `packages/activerecord/relation.ts`                   |
|    2 | `packages/activerecord/relation/batches.ts`           |
|    2 | `packages/activerecord/relation/predicate-builder.ts` |
|    1 | `packages/activerecord/relation/merger.ts`            |

Representative rows (Ruby args → TS args):

- `insert-all.ts#constructor` calling `keys`: Ruby `ref:scopeAttributes` → TS `ref:_scopeAttributes`
- `insert-all.ts#mapKeyWithValue` calling `verify_attributes`: Ruby `ref:attributes` → TS `ref:merged`
- `insert-all.ts#resolveAttributeAliases` calling `resolve_attribute_alias`: Ruby `ref:attribute` → TS `ref:key`
- `insert-all.ts#resolveAttributeAliases` calling `resolve_attribute_alias`: Ruby `ref:attribute` → TS `ref:c`
- `insert-all.ts#resolveAttributeAliases` calling `resolve_attribute_alias`: Ruby `ref:attribute` → TS `ref:uniqueBy`
- `insert-all.ts#uniqueIndexes` calling `indexes`: Ruby `ref:tableName` → TS `ref:name`
- `insert-all.ts#toSql` calling `new`: Ruby `ref:this` → TS `ref:adapterName`
- `relation.ts#touchAll` calling `update_all`: Ruby `ref:touchAttributesWithTime` → TS `ref:call`

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
