---
title: "activerecord: move the Timezone, Delegation, FinderMethods and association-module bodies inlined into their hosts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
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
`include()` / `this`-typed functions. This story takes 10:

- `type/internal/timezone.rb` → `type/date-time.ts#constructor`, `type/date.ts#constructor`, `type/time.ts#constructor`
- `relation/delegation.rb` → `relation.ts#_create`, `relation.ts#name`, `relation.ts#unscoped`
- `relation/finder_methods.rb` → `relation.ts#_take`, `relation.ts#applyJoinDependency`
- `associations/through_association.rb` → `associations/has-many-through-association.ts#buildRecord`
- `associations/foreign_association.rb` → `associations/has-one-association.ts#setOwnerAttributes`

## Acceptance criteria

- [ ] Each body lives in the TS file mirroring its `.rb`, and the host reaches it through `include()` / `Included<>` or a `this`-typed function assigned to the class — no delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` lists none of these `inlined-from` rows; activerecord stays rowless on `parity:api:extra:gate`.
- [ ] `pnpm lint --fix` (`rails-file-structure-method-order`) leaves the moved members in Rails source order.
- [ ] No behaviour change: the touched model/relation/adapter test files are green on SQLite (and PG/MySQL for adapter files).

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
