---
title: "activerecord: Core.shard_selector is a plain static where Rails declares a class_attribute"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:105` is
`class_attribute :shard_selector, instance_accessor: false, default: nil`, inside `Core`'s
`included do` block beside `default_shard` and `attributes_for_inspect`.

trails declares it as `static shardSelector: unknown = null;` on `Base`
(`packages/activerecord/src/base.ts`). A plain static has no `class_attribute` semantics: there is
no `shard_selector?` predicate, and a subclass write is an ordinary own-property shadow rather
than the redefinition `ClassAttribute.redefine` performs. Its neighbours are already converged:
`Core[included]` in `packages/activerecord/src/core.ts` declares `defaultShard` and
`attributesForInspect` through `classAttribute.call(base, ...)`.

## Acceptance criteria

- [ ] `Core[included]` declares
      `classAttribute.call(base, "shardSelector", { instanceAccessor: false, default: null })`
      at the position `core.rb:105` has it, between `defaultShard` and `attributesForInspect`.
- [ ] `base.ts` carries only `declare static shardSelector` (and the predicate), no initializer.
- [ ] Every reader and writer of `shardSelector` still type-checks and its tests pass.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm vitest run packages/activerecord/src/core.test.ts
```
