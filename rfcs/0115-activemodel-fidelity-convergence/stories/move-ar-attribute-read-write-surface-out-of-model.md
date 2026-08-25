---
title: "Move the ActiveRecord attribute read/write surface out of activemodel/model.ts"
status: done
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activerecord"]
deps:
  - move-ar-normalization-surface-out-of-model
deps-rfc: []
est-loc: 280
priority: null
pr: 6846
claim: "2026-08-21T23:08:30Z"
assignee: "move-ar-attribute-read-write-surface-out-of-model"
blocked-by: null
closed-reason: null
---

## Context

Seven `Model` instance members have no ActiveModel counterpart; every one of
them is ActiveRecord surface parked on `ActiveModel::Model` because
`packages/activerecord/src/base.ts:871` is `class Base extends Model`:

| trails                                        | Rails home                                              |
| --------------------------------------------- | ------------------------------------------------------- |
| `model.ts:1757` `readAttribute` (5L)          | `activerecord/attribute_methods/read.rb:38`             |
| `model.ts:1799` `writeAttribute` (4L)         | `activerecord/attribute_methods/write.rb:47`            |
| `model.ts:1844` `readAttributeBeforeTypeCast` | `activerecord/attribute_methods/before_type_cast.rb:48` |
| `model.ts:1859` `attributesBeforeTypeCast`    | `activerecord/attribute_methods/before_type_cast.rb:66` |
| `model.ts:1868` `columnForAttribute` (5L)     | `activerecord/model_schema.rb:463`                      |
| `model.ts:1879` `hasAttribute` (5L)           | `activerecord/attribute_methods.rb:316`                 |
| `model.ts:1900` `attributePresent` (6L)       | `activerecord/attribute_methods.rb:387`                 |

32 code lines. ActiveModel's own `attribute_methods.rb` has `_read_attribute`
(`:236` in `packages/activemodel/src/attribute-methods.ts`) and
`attributes.rb`'s `_write_attribute` — those are the ActiveModel names and they
stay. The un-underscored public pair is ActiveRecord's.

All four destination files exist:
`packages/activerecord/src/attribute-methods/{read,write,before-type-cast}.ts`
(94 / 83 / 90 lines) and `packages/activerecord/src/attribute-methods.ts`.
`base.ts:4809-4812` documents the current arrangement — _"readAttributeBefore
TypeCast/attributesBeforeTypeCast — inherited from Model.prototype … Category
A: inherited, extractor limitation"_ — and that comment retires with it.

Note the getter/property hazard called out in CLAUDE.md's "Generated attribute
readers are properties" section: `attributesBeforeTypeCast` is a getter, and
`base.ts:4813-4815` records that wiring getters through `include()` replaces the
descriptor with a data property. Use `Object.defineProperty`-preserving
mix-in, and pin it with a test.

## Acceptance criteria

- The seven members are defined in their Rails-counterpart `activerecord` files
  at their Rails names; `model.ts` defines none of them.
- Getter members stay getters on the `Base` prototype — assert the descriptor
  kind in a test, not just the value.
- `base.ts:4809-4817`'s Category-A comment block is deleted with the code it
  described.
- `pnpm parity:api:extra --package activemodel` drops `readAttribute`,
  `writeAttribute`, `readAttributeBeforeTypeCast`, `attributesBeforeTypeCast`,
  `columnForAttribute`, `hasAttribute`, `attributePresent` from `model.ts`.
- Both packages' `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean, no reseed.

## Verification

```bash
pnpm vitest run packages/activerecord/src/attribute-methods.test.ts packages/activerecord/src/attribute-methods/read.test.ts packages/activerecord/src/attribute-methods/write.test.ts packages/activemodel/src/attribute-methods.test.ts
```
