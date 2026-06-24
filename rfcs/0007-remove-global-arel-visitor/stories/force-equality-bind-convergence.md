---
title: "force-equality-bind-convergence"
status: ready
updated: 2026-06-24
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `PredicateBuilder#build` (predicate_builder.rb) emits a **bind** for a
force-equality type:

```ruby
if !value.nil? && table.type(attribute.name).force_equality?(value)
  bind = build_bind_attribute(attribute.name, value)
  attribute.eq(bind)
```

trails diverges: `PredicateBuilder#_buildRangeEqualityOrNull`
(`packages/activerecord/src/relation/predicate-builder.ts`) emits an **inline
`Nodes.Quoted` literal** via the type's `encodeLiteral`
(`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts`
`encodeLiteral`) instead of a bind. The inline literal IS connection-routed
(`visitQuoted` → adapter `quote()`), so it is not an arel-default-quoter leak —
but it is still a Rails deviation (literal vs `$N` bind) and only works for types
that implement `encodeLiteral` (types without it fall through to the handler).

Surfaced during `drop-default-quoter-production-reliance` (PR TBD): switching to
`attribute.eq(buildBindAttribute(...))` to match Rails breaks at runtime because
**range bind values are not run through the pg adapter's `typeCast`**. A `Range`
reaches pg as a raw object (`malformed range literal: "{"begin":1,...}"`).

Root cause: `typeCastedBinds` (pg adapter `execQuery`,
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:911`)
extracts `value_for_database` but does NOT apply the adapter's `typeCast`
(`connection-adapters/postgresql/quoting.ts:220`, which handles `Range` →
`encodeRange` string). Rails' `type_casted_binds` does apply the adapter
type_cast. `_bindForPg` only normalizes Temporal / BinaryData.

NOTE: this intersects the documented PG bind-everything fragility
(pinned-client write-query serialization). Apply the bind type_cast narrowly
(object-valued binds like Range/array) rather than bind-everything.

## Acceptance criteria

- [ ] `where(rangeCol: aRange)` (and other force-equality types) emits a `$N`
      bind, matching Rails' `attribute.eq(build_bind_attribute(...))`, not an
      inline literal.
- [ ] pg bind path applies the adapter's `typeCast` to object-valued binds so a
      `Range` (and PG array/serialized force-equality values) serialize to the
      correct pg literal string parameter.
- [ ] `_buildRangeEqualityOrNull` drops the `encodeLiteral` inline path; the
      now-dead `RangeType#encodeLiteral` is removed.
- [ ] All `packages/activerecord/src/adapters/postgresql/range.test.ts`
      behavioral tests stay green; `test:compare` non-negative.
- [ ] Does NOT reintroduce bind-everything (avoid the pinned-client hang) — cast
      only object-valued binds.
