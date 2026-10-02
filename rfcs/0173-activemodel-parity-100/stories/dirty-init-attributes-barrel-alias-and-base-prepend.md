---
title: "activemodel: delete the dirtyInitAttributes barrel alias and Base's hand-written prepend"
status: closed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel", "activerecord"]
deps: ["activemodel-dirty-init-attributes-arity"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#8368 (7a37a9253d, activemodel-dirty-init-attributes-arity): its diff deletes 'initAttributes as dirtyInitAttributes' from packages/activemodel/src/index.ts and 'prepend(Base.prototype, { initAttributes: dirtyInitAttributes as PrependMethod })' from packages/activerecord/src/base.ts. On origin/main ea4bfa7591, 'git grep dirtyInitAttributes origin/main -- packages scripts' is empty; init_attributes reaches Base through include(Base, AMDirty), whose included hook does include(base, InitAttributes) (dirty.ts:38)."
---

## Context

Surfaced by trails#8321 (`activemodel-audit-permanent-receipts-root`), which deleted a
`@noRailsEquivalent PERMANENT` tag on an `export { … }` statement nothing reads.

`packages/activemodel/src/index.ts` re-exports `Dirty#init_attributes` under an invented name:

```ts
export { Dirty, initAttributes as dirtyInitAttributes } from "./dirty.js";
```

Its one consumer is `packages/activerecord/src/base.ts`:
`prepend(Base.prototype, { initAttributes: dirtyInitAttributes as PrependMethod })`. Rails has no such
step: `ActiveRecord::AttributeMethods::Dirty` does `include ActiveModel::Dirty`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/dirty.rb`), and
`ActiveModel::Dirty#init_attributes(other)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/dirty.rb:253-261`)
reaches the host's implementation through `super`. The alias exists only because the port threads
`super_` as a leading parameter, which `activemodel-dirty-init-attributes-arity` (this RFC) removes.
That story's acceptance criteria do not mention the barrel alias or the `base.ts` `prepend`, and a tag
on an export statement is not surfaced by the extractor, so nothing else tracks it.

## Acceptance criteria

- [ ] `dirtyInitAttributes` is deleted from `packages/activemodel/src/index.ts`; `init_attributes` reaches `Base` through the `include ActiveModel::Dirty` edge, with no hand-written `prepend` in `base.ts`.
- [ ] `pnpm parity:api:extra --package activemodel` and `pnpm parity:api:extra:gate` green.
- [ ] `packages/activemodel/src/dirty.test.ts` and activerecord's `dup.test.ts` green.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:extra:gate && pnpm vitest run packages/activemodel/src/dirty.test.ts packages/activerecord/src/dup.test.ts
```
