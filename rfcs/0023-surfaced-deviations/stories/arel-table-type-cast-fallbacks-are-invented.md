---
title: "arel-table-type-cast-fallbacks-are-invented"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T03:21:13Z"
assignee: "arel-table-type-cast-fallbacks-are-invented"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4877 (arel-attribute-caster-is-a-trails-invention),
which removed the invented `caster` field from `Arel::Attributes::Attribute`
and converged `Attribute`'s three delegators to bare calls per
`attribute.rb:12-14, 22-24, 26-28`. The same invented "guard and fall back"
pattern remains one level down, on `Table` and `TableAlias`.

**`Table` (`packages/arel/src/table.ts:154-180`).** Rails delegates bare
(`arel/table.rb:102-112`):

```ruby
def type_cast_for_database(attr_name, value)
  type_caster.type_cast_for_database(attr_name, value)
end

def type_for_attribute(name)
  type_caster.type_for_attribute(name)
end

def able_to_type_cast?
  !type_caster.nil?
end
```

Trails guards twice — on `typeCaster` being non-null _and_ on the method
existing — then falls back to `value` / `undefined`. Only `isAbleToTypeCast`
(`table.ts:178-180`, `this.typeCaster != null`) already matches `table.rb:110-112`.

**`TableAlias` (`packages/arel/src/nodes/table-alias.ts:35-48`).**
`table_alias.rb:18-24` also delegates bare:

```ruby
def type_cast_for_database(attr_name, value)
  relation.type_cast_for_database(attr_name, value)
end

def type_for_attribute(name)
  relation.type_for_attribute(name)
end
```

Note the asymmetry, which must be preserved: `table_alias.rb:26-28`
`able_to_type_cast?` _is_ `respond_to?`-guarded
(`relation.respond_to?(:able_to_type_cast?) && relation.able_to_type_cast?`)
because a `TableAlias`'s relation may be a `SelectManager`, which has no such
method. `table-alias.ts:45-48` already mirrors that one correctly — do not
"converge" it away.

## Reachability — read before assuming this is dead code

The two fallbacks differ, and the #4877 review initially framed both as
unreachable. That is only half right:

- `typeCastForDatabase`'s fallback **is** effectively dead: the only consumer
  is `Casted#valueForDatabase` (`casted.ts:74-79`), which gates on
  `isAbleToTypeCast()` first, so `typeCaster` is non-null by then.
- `typeForAttribute`'s fallback **is reachable and ungated**:
  `Attribute#typeCaster` (`attribute.ts:110-112`) calls
  `relation.typeForAttribute(name)` with no `able_to_type_cast?` gate, and
  `HomogeneousIn#castedValues` (`homogeneous-in.ts:62-78`) consumes it.

So a `Table` whose `typeCaster` implements `type_cast_for_database` but not
`type_for_attribute` currently gets `undefined`, whereas bare delegation
would throw. Rails throws too (`NoMethodError`), so bare delegation is the
faithful behavior — but this is a live path, and our own Rails-ported test
fixture is exactly such a partial caster: `attribute.test.ts` "type casts when
given an explicit caster" builds a `fakeCaster` with only
`typeCastForDatabase`, mirroring Rails' `fake_caster`
(`attribute_test.rb:1132-1146`). Confirm no ported test drives a
`HomogeneousIn` through a partial caster before removing the fallback.

In production every caster is a full `TypeCaster::Map` / `TypeCaster::Connection`
(`activerecord/src/type-caster/`), both of which implement all members.

## Acceptance criteria

- [ ] `Table#typeCastForDatabase` and `Table#typeForAttribute` delegate bare
      to `typeCaster`, matching `table.rb:102-108`. `Table#isAbleToTypeCast`
      stays as-is (already matches `table.rb:110-112`).
- [ ] `TableAlias#typeCastForDatabase` and `TableAlias#typeForAttribute`
      delegate bare to `relation`, matching `table_alias.rb:18-24`.
- [ ] `TableAlias#isAbleToTypeCast` keeps its `respond_to?`-equivalent guard
      per `table_alias.rb:26-28` — it is Rails-backed, not an invention.
- [ ] The local `TypeCastable` interface (`table-alias.ts:8-12`) is tightened
      or removed in step with the above, so the optionality does not just move.
- [ ] Reachability of `typeForAttribute` via `Attribute#typeCaster` →
      `HomogeneousIn#castedValues` is checked against the ported tests (see
      above); no test name changes.
- [ ] api:compare / test:compare delta non-negative.
