---
title: "Burn down the remaining 47 naming call-argument rows in associations, reflection, autosave and nested attributes"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 188
pr: 6420
claim: "2026-08-12T15:43:28Z"
assignee: "naming-burndown-2-ar-associations"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in associations, reflection, autosave and nested attributes: **47 rows across 18 files**.

| Rows | File                                                                       |
| ---: | -------------------------------------------------------------------------- |
|    6 | `packages/activerecord/associations/association-scope.ts`                  |
|    6 | `packages/activerecord/autosave-association.ts`                            |
|    5 | `packages/activerecord/associations/has-many-through-association.ts`       |
|    4 | `packages/activerecord/associations/join-dependency.ts`                    |
|    4 | `packages/activerecord/reflection.ts`                                      |
|    3 | `packages/activerecord/associations/association.ts`                        |
|    2 | `packages/activerecord/associations/belongs-to-association.ts`             |
|    2 | `packages/activerecord/associations/collection-association.ts`             |
|    2 | `packages/activerecord/associations/has-many-association.ts`               |
|    2 | `packages/activerecord/associations/has-one-through-association.ts`        |
|    2 | `packages/activerecord/associations/preloader/association.ts`              |
|    2 | `packages/activerecord/associations/preloader/branch.ts`                   |
|    2 | `packages/activerecord/nested-attributes.ts`                               |
|    1 | `packages/activerecord/associations/belongs-to-polymorphic-association.ts` |
|    1 | `packages/activerecord/associations/builder/belongs-to.ts`                 |
|    1 | `packages/activerecord/associations/collection-proxy.ts`                   |
|    1 | `packages/activerecord/associations/join-dependency/join-association.ts`   |
|    1 | `packages/activerecord/associations/join-dependency/join-part.ts`          |

Representative rows (Ruby args → TS args):

- `associations/association-scope.ts#lastChainScope` calling `transform_value`: Ruby `ref:_readAttribute` → TS `ref:rawValue`
- `associations/association-scope.ts#lastChainScope` calling `apply_scope`: Ruby `ref:scope, ref:table, ref:type, ref:polymorphicType` → TS `ref:scope, ref:tableNode, ref:type, ref:polyName`
- `associations/association-scope.ts#nextChainScope` calling `transform_value`: Ruby `ref:polymorphicName` → TS `ref:nextName`
- `associations/association-scope.ts#nextChainScope` calling `apply_scope`: Ruby `ref:scope, ref:table, ref:type, ref:value` → TS `ref:scope, ref:tableNode, ref:type, ref:transformValue`
- `associations/association-scope.ts#nextChainScope` calling `join`: Ruby `ref:foreignTable, ref:constraints` → TS `ref:foreignTableNode, ref:constraint`
- `associations/association-scope.ts#getChain` calling `new`: Ruby `ref:refl, ref:aliasedTable` → TS `ref:refl, ref:aliased`
- `associations/association.ts#buildRecord` calling `initialize_attributes`: Ruby `ref:record, ref:attributes` → TS `ref:r, ref:attributes`
- `associations/association.ts#isMatchesForeignKey` calling `read_attribute`: Ruby `ref:foreignKey` → TS `ref:key`

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
