---
title: "activerecord: move the Persistence / ModelSchema / CounterCache bodies inlined into base.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: ["activerecord-converge-schema-load-and-primary-key-convergeable-receipts"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports **128** "inlined module bodies" — a Ruby
module member whose TS body sits on an including class's file instead of the file mirroring the module
(the mirror image of `moved`). It is report-only today, so nothing stops it growing; CLAUDE.md
§ "Decomposition" and § "Module mixins" require the body in the module's file, reached through
`include()` / `this`-typed functions. This story takes 14:

- `persistence.rb` → `base.ts#_destroyed`, `base.ts#_destroyRow`, `base.ts#_instantiate`, `base.ts#_newRecord`, `base.ts#_previouslyNewRecord`, `base.ts#createOrUpdate`
- `model_schema.rb` → `base.ts#_ignoredColumns`, `base.ts#_protectedEnvironments`, `base.ts#_sequenceName`, `base.ts#_tableName`
- `counter_cache.rb` → `base.ts#_counterCacheColumns`, `base.ts#counterCachedAssociationNames`, `base.ts#is_counterCacheColumns`, `base.ts#isCounterCachedAssociationNames`

## Acceptance criteria

- [ ] Each body lives in the TS file mirroring its `.rb`, and the host reaches it through `include()` / `Included<>` or a `this`-typed function assigned to the class — no delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` lists none of these `inlined-from` rows; activerecord stays rowless on `parity:api:extra:gate`.
- [ ] `pnpm lint --fix` (`rails-file-structure-method-order`) leaves the moved members in Rails source order.
- [ ] No behaviour change: the touched model/relation/adapter test files are green on SQLite (and PG/MySQL for adapter files).

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
