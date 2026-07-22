---
title: "buildComposite qualified cols bind through the base table's type (no re-rooting)"
status: ready
updated: 2026-07-22
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `predicate-builder-type-lookup-cascade-is-invented` (PR #5063),
which collapsed all bind typing to Rails' single source `table.type(name)`
(`predicate_builder.rb:67-69`). `PredicateBuilder#buildComposite`
(`packages/activerecord/src/relation/predicate-builder.ts`, the trails-only
surface for `Relation#where(cols, tuples)` — JS object keys can't be arrays)
resolves qualified cols like `"orders.shop_id"` through `resolveColumn` →
`resolveArelAttribute`, so the ATTRIBUTE is rooted on the joined table, but the
bind is built via `this.buildBindAttribute(attr.name, tuple[i])`, which types
`"shop_id"` against the BUILDER'S own table. Rails' composite path
(`expand_from_hash`'s Array-key branch, `predicate_builder.rb:88-98`) re-roots
per key via `associated_table(key).predicate_builder`, so the bind type always
comes from the joined table's metadata. trails' buildComposite never re-roots:
a qualified column whose name doesn't exist on the base table types through the
base caster's default `ValueType` (silent no-op cast), and a same-named column
with a different type on the base table types through the WRONG type.

## Acceptance criteria

- [ ] Qualified composite cols bind through the joined table's
      `TableMetadata#type`, e.g. by routing tuples through the re-rooted
      builder the way Rails' Array-key branch does — or buildComposite is
      converged onto `expand_from_hash`'s Array-key shape outright.
- [ ] A regression test: composite where with a qualified col whose type
      differs from (or is absent on) the base table binds through the joined
      table's type.
- [ ] No test renames; api:compare / test:compare delta non-negative.
