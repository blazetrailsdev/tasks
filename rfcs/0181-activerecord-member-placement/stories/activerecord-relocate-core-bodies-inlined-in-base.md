---
title: "activerecord: move the 13 Core bodies inlined into base.ts back to core.ts"
status: done
updated: 2026-10-02
rfc: "0181-activerecord-member-placement"
cluster: placement
packages: ["activerecord"]
deps: ["activerecord-core-attributes-for-inspect"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8383
claim: "2026-10-02T03:41:55Z"
assignee: "activemodel-enroll-in-extra-surface-gate-rowless"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports **128** "inlined module bodies" — a Ruby
module member whose TS body sits on an including class's file instead of the file mirroring the module
(the mirror image of `moved`). It is report-only today, so nothing stops it growing; CLAUDE.md
§ "Decomposition" and § "Module mixins" require the body in the module's file, reached through
`include()` / `this`-typed functions. This story takes 13:

- `core.rb` → `base.ts#_connectionClass`, `base.ts#_destroyAssociationAsyncJob`, `base.ts#_filterAttributes`, `base.ts#_strictLoadingMode`, `base.ts#belongsToRequiredByDefault`, `base.ts#constructor`, `base.ts#enumerateColumnsInSelectStatements`, `base.ts#hasManyInversing`, `base.ts#readonly`, `base.ts#runCommitCallbacksOnFirstSavedInstancesInTransaction`, `base.ts#shardSelector`, `base.ts#strictLoading`, `base.ts#strictLoadingByDefault`

## Acceptance criteria

- [ ] Each body lives in the TS file mirroring its `.rb`, and the host reaches it through `include()` / `Included<>` or a `this`-typed function assigned to the class — no delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` lists none of these `inlined-from` rows; activerecord stays rowless on `parity:api:extra:gate`.
- [ ] `pnpm lint --fix` (`rails-file-structure-method-order`) leaves the moved members in Rails source order.
- [ ] No behaviour change: the touched model/relation/adapter test files are green on SQLite (and PG/MySQL for adapter files).

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
