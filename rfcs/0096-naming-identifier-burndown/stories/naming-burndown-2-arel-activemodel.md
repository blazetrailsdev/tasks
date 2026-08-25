---
title: "Burn down the remaining 46 naming call-argument rows in arel and activemodel"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["arel", "activemodel"]
deps: []
deps-rfc: []
est-loc: 184
pr: 6421
claim: "2026-08-12T15:43:37Z"
assignee: "naming-burndown-2-arel-activemodel"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in arel and activemodel: **46 rows across 27 files**.

| Rows | File                                                      |
| ---: | --------------------------------------------------------- |
|    4 | `packages/arel/select-manager.ts`                         |
|    4 | `packages/activemodel/type/date.ts`                       |
|    3 | `packages/arel/update-manager.ts`                         |
|    3 | `packages/arel/visitors/to-sql.ts`                        |
|    3 | `packages/activemodel/attribute-methods.ts`               |
|    3 | `packages/activemodel/type/helpers/numeric.ts`            |
|    2 | `packages/arel/nodes/window.ts`                           |
|    2 | `packages/activemodel/attribute-assignment.ts`            |
|    2 | `packages/activemodel/attribute-set.ts`                   |
|    2 | `packages/activemodel/type/date-time.ts`                  |
|    2 | `packages/activemodel/validations/numericality.ts`        |
|    1 | `packages/arel/attributes/attribute.ts`                   |
|    1 | `packages/arel/collectors/substitute-binds.ts`            |
|    1 | `packages/arel/delete-manager.ts`                         |
|    1 | `packages/arel/factory-methods.ts`                        |
|    1 | `packages/arel/nodes/homogeneous-in.ts`                   |
|    1 | `packages/arel/nodes/infix-operation.ts`                  |
|    1 | `packages/arel/nodes/node-expression.ts`                  |
|    1 | `packages/arel/nodes/sql-literal.ts`                      |
|    1 | `packages/arel/predications.ts`                           |
|    1 | `packages/arel/table.ts`                                  |
|    1 | `packages/arel/visitors/dot.ts`                           |
|    1 | `packages/activemodel/attribute-set/builder.ts`           |
|    1 | `packages/activemodel/attribute.ts`                       |
|    1 | `packages/activemodel/attribute/user-provided-default.ts` |
|    1 | `packages/activemodel/error.ts`                           |
|    1 | `packages/activemodel/errors.ts`                          |

Representative rows (Ruby args → TS args):

- `attributes/attribute.ts#groupingAny` calling `new`: Ruby `ref:inject` → TS `ref:reduce`
- `collectors/substitute-binds.ts#addBind` calling `quote`: Ruby `ref:bind` → TS `ref:extractValue`
- `delete-manager.ts#group` calling `new`: Ruby `ref:toS` → TS `ref:constructor`
- `factory-methods.ts#createStringJoin` calling `create_join`: Ruby `ref:to, nil, const:StringJoin` → TS `ref:node, nil, const:StringJoin`
- `nodes/homogeneous-in.ts#procForBinds` calling `with_cast_value`: Ruby `ref:name, ref:value, ref:defaultValue` → TS `ref:attrName, ref:value, ref:defaultType`
- `nodes/infix-operation.ts#groupingAny` calling `new`: Ruby `ref:inject` → TS `ref:reduce`
- `nodes/node-expression.ts#groupingAny` calling `new`: Ruby `ref:inject` → TS `ref:reduce`
- `nodes/sql-literal.ts#groupingAny` calling `new`: Ruby `ref:inject` → TS `ref:reduce`

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
