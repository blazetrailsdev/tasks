---
title: "PredicateBuilder type lookups are invented cascades with identity fallbacks"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while doing `arel-table-type-cast-fallbacks-are-invented` (PR #4888).
Removing `Table#typeForAttribute`'s fallback made these call sites raise, which
exposed that each one is an invented multi-source cascade with an identity
fallback. Rails resolves a column type from exactly **one** source, with no
fallback (`predicate_builder.rb:67-69`):

```ruby
def build_bind_attribute(column_name, value)
  Relation::QueryAttribute.new(column_name, value, table.type(column_name))
end
```

`table` is a `TableMetadata`, and `TableMetadata#type` is
`arel_table.type_for_attribute(column_name)` (`table_metadata.rb:17-19`) — one
hop, and it raises if the arel table has no caster. trails instead has three
divergent lookups in `packages/activerecord/src/relation/predicate-builder.ts`:

1. `buildBindAttribute` — `this.table.typeForAttribute(...)` then
   `?? { cast: identity, serialize: identity }`. Rails has no fallback: a
   missing type is a bug, not an identity cast that silently binds a raw value
   the column cannot hold.
2. `resolveBoundType` — a 3-source cascade (attribute's own `relation`, then
   `_tableContext`, then `this.table`), documented in-file as "Mirrors the
   cascade Rails' `build_bind_attribute` gets for free" — but Rails has no
   cascade at all.
3. `_buildForceEqualityOrNull` — the same 3-source cascade again, against
   `table.type(attribute.name).force_equality?(value)`
   (`predicate_builder.rb:#build`), which is single-source.

`queryAttributeWithType` carries the same identity fallback.

## Why it matters

The identity fallback is the invention with teeth: it converts "we could not
type this column" into "bind the raw value", which is how a mistyped bound
reaches the adapter instead of raising. The in-file comments assert the cascade
mirrors Rails; it does not, and that claim should not survive.

Note this likely **depends on** `arel-join-tables-lack-type-casters`: the
cascade exists partly to paper over caster-less join tables. Converge that
first, then collapse these to `table.type(name)`.

## Acceptance criteria

- [ ] `buildBindAttribute` is `new QueryAttribute(columnName, value, this.table.type(columnName))`,
      single-source, no identity fallback — matching `predicate_builder.rb:67-69`.
- [ ] `resolveBoundType` and `_buildForceEqualityOrNull`'s cascade collapse to
      the same single-source lookup, or the cascade is justified in-comment with
      a Rails `file:line` that actually shows one.
- [ ] The "Mirrors the cascade Rails' `build_bind_attribute` gets for free"
      comment is removed or corrected.
- [ ] `TableMetadata#typeForAttribute` (`table-metadata.ts:35-37`) — a trails
      addition; Rails' TableMetadata exposes only `type` — is removed or
      justified.
- [ ] No test name changes. api:compare / test:compare delta non-negative.
