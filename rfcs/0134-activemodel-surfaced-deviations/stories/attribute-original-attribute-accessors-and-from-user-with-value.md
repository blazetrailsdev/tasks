---
title: "Attribute's get/setOriginalAttribute pair and fromUserWithValue have no Rails counterpart"
status: draft
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7400, which removed `Attribute#overrideCastValue`. Three novel
names remain on `packages/activemodel/src/attribute.ts`
(`pnpm parity:api:extra --package activemodel`: `attribute.ts — 4 novel`), none
receipted:

- `getOriginalAttribute()` (`attribute.ts:239`) and `setOriginalAttribute()`
  (`:243`). Rails has neither. `attribute.rb:152` is
  `protected attr_reader :original_attribute`, with
  `alias :assigned? :original_attribute` (`:153`) beside it, and the field is
  written only by `initialize` (`:37`) and `init_with` (`:131`). A Ruby
  zero-arg reader ports as an accessor property (CLAUDE.md, "Generated
  attribute readers are properties"), so the pair should be one `protected get
originalAttribute()`.
- `fromUserWithValue()` (`:247`). `attribute.rb:12-14`'s `from_user` takes
  `(name, value_before_type_cast, type, original_attribute = nil)` and no eager
  `value`; there is no such factory anywhere in `attribute.rb`.

The fourth, `[rubyNamespace]`, is a JS `Symbol`-keyed brand and is a separate
question.

## Converged shape

Replace the accessor pair with `protected get originalAttribute()` at Rails'
name and visibility, and fold `isAssigned()` (`attribute.ts:205`) onto it as
`assigned?`'s alias. Trace `fromUserWithValue`'s callers: either they want
`Attribute.from_user` followed by the ordinary cast, or the eager value belongs
on `from_database`'s fourth argument (`attribute.rb:8-10`), which IS Rails'
seeded-value factory. Delete it once they do.

## Acceptance criteria

- `getOriginalAttribute` / `setOriginalAttribute` / `fromUserWithValue` are gone
  from `packages/activemodel/src/attribute.ts`.
- `pnpm parity:api:extra --package activemodel` loses all three novel rows on
  `attribute.ts`; no mark widened.
- `attribute.test.ts` and `attribute.trails.test.ts` green.
