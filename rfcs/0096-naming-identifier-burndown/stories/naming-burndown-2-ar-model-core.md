---
title: "Burn down the remaining 50 naming call-argument rows in the model core — attributes, enum, validations, scoping, timestamps"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
pr: 6386
claim: "2026-08-11T23:31:32Z"
assignee: "naming-burndown-2-pg-adapter"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in the model core — attributes, enum, validations, scoping, timestamps: **50 rows across 30 files**.

| Rows | File                                                                     |
| ---: | ------------------------------------------------------------------------ |
|    4 | `packages/activerecord/token-for.ts`                                     |
|    3 | `packages/activerecord/core.ts`                                          |
|    3 | `packages/activerecord/database-configurations.ts`                       |
|    3 | `packages/activerecord/enum.ts`                                          |
|    3 | `packages/activerecord/model-schema.ts`                                  |
|    3 | `packages/activerecord/validations/uniqueness.ts`                        |
|    2 | `packages/activerecord/connection-handling.ts`                           |
|    2 | `packages/activerecord/counter-cache.ts`                                 |
|    2 | `packages/activerecord/locking/optimistic.ts`                            |
|    2 | `packages/activerecord/sanitization.ts`                                  |
|    2 | `packages/activerecord/scoping/default.ts`                               |
|    2 | `packages/activerecord/store.ts`                                         |
|    2 | `packages/activerecord/timestamp.ts`                                     |
|    1 | `packages/activerecord/attribute-methods.ts`                             |
|    1 | `packages/activerecord/attribute-methods/primary-key.ts`                 |
|    1 | `packages/activerecord/attribute-methods/serialization.ts`               |
|    1 | `packages/activerecord/attributes.ts`                                    |
|    1 | `packages/activerecord/internal-metadata.ts`                             |
|    1 | `packages/activerecord/middleware/database-selector/resolver/session.ts` |
|    1 | `packages/activerecord/migration.ts`                                     |
|    1 | `packages/activerecord/migration/command-recorder.ts`                    |
|    1 | `packages/activerecord/normalization.ts`                                 |
|    1 | `packages/activerecord/result.ts`                                        |
|    1 | `packages/activerecord/schema.ts`                                        |
|    1 | `packages/activerecord/scoping/named.ts`                                 |
|    1 | `packages/activerecord/signed-id.ts`                                     |
|    1 | `packages/activerecord/statement-cache.ts`                               |
|    1 | `packages/activerecord/table-metadata.ts`                                |
|    1 | `packages/activerecord/touch-later.ts`                                   |
|    1 | `packages/activerecord/validations/associated.ts`                        |

Representative rows (Ruby args → TS args):

- `attribute-methods.ts#generateAliasAttributeMethods` calling `alias_attribute_method_definition`: Ruby `ref:codeGenerator, ref:pattern, ref:newName, ref:oldName` → TS `ref:host, ref:pattern, ref:newName, ref:oldName`
- `attribute-methods/primary-key.ts#quotedPrimaryKey` calling `quote_column_name`: Ruby `ref:primaryKey` → TS `ref:k`
- `attribute-methods/serialization.ts#buildColumnSerializer` calling `new`: Ruby `ref:attrName, ref:coder, ref:type` → TS `ref:attrName, ref:resolvedCoder, ref:type`
- `attributes.ts#_defaultAttributes` calling `new`: Ruby `ref:attributesHash` → TS `ref:attrMap`
- `connection-handling.ts#connectionPool` calling `retrieve_connection_pool`: Ruby `ref:connectionSpecificationName, kwargs{role=ref:currentRole,shard=ref:currentShard,strict=bool:true}` → TS `ref:call, kwargs{role=ref:currentRole,shard=ref:currentShard,strict=bool:true}`
- `connection-handling.ts#retrieveConnection` calling `retrieve_connection`: Ruby `ref:connectionSpecificationName, kwargs{role=ref:currentRole,shard=ref:currentShard}` → TS `ref:call, kwargs{role=ref:currentRole,shard=ref:currentShard}`
- `core.ts#strictLoadingViolationBang` calling `new`: Ruby `ref:message` → TS `ref:strictLoadingViolationMessage`
- `core.ts#predicateBuilder` calling `new`: Ruby `ref:constructor` → TS `ref:metadata`

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
