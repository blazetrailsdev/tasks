---
title: "FromUser#_value_for_database inlines Type::SerializeCastValue.serialize and drops its rescue-nil arm"
status: draft
updated: 2026-09-20
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `attribute_test.rb` in trails#7899.

Rails dispatches through the module function
(`activemodel/lib/active_model/attribute.rb:206-209`):

```ruby
class FromUser < Attribute
  private
    def _value_for_database
      Type::SerializeCastValue.serialize(type, value)
    end
end
```

and the module holds the compatibility test
(`activemodel/lib/active_model/type/serialize_cast_value.rb:28-33`):

```ruby
def self.serialize(type, value)
  # Use `type.equal?(...)` to prevent unexpected behavior from a custom `==`
  if type.equal?((type.itself_if_serialize_cast_value_compatible rescue nil))
    type.serialize_cast_value(value)
  else
    type.serialize(value)
  end
end
```

Two things live in that body that the caller does not have to know about: the
`equal?` identity check (deliberately not `==`, per the comment) and the `rescue nil`
that makes a type which does not respond to
`itself_if_serialize_cast_value_compatible` fall through to plain `serialize`.

trails inlines the module body into the caller
(`packages/activemodel/src/attribute.ts:276-283`):

```ts
protected override _valueForDatabase(): unknown {
  const compatible = this.type!.itselfIfSerializeCastValueCompatible();
  if (compatible === this.type) {
    return this.type!.serializeCastValue(this.value);
  }
  return this.type!.serialize(this.value);
}
```

`SerializeCastValue.serialize` exists in trails already
(`packages/activemodel/src/type/serialize-cast-value.ts`) and is what the body should
call, so this is an inlined delegation, not a missing capability. It costs:

- **The `rescue nil` arm is gone.** trails calls
  `itselfIfSerializeCastValueCompatible()` unconditionally, so a type that does not
  define it throws `TypeError` where Rails falls through to `serialize`. This is not
  hypothetical: `attribute_test.rb:7-22`'s `InscribingType` is a bare `class` with
  only `cast` / `serialize` / `deserialize` / `changed_in_place?`, and Rails runs
  `from_user + value_for_database type casts from the user to the database`
  (`:81-85`) against it happily. The trails port of that test has to make
  `InscribingType extend ValueType` purely to acquire the method this body demands —
  a test-side deviation caused by a production-side one.
- The `equal?`-not-`==` intent is re-derived at the call site instead of being read
  once from the module.
- `serialize-cast-value.ts` also exports a standalone
  `itselfIfSerializeCastValueCompatible(type)` that already implements the
  `respond_to?` guard (`typeof type.itselfIfSerializeCastValueCompatible === "function"`),
  so the correct arm is written and simply not called.

### Converged shape

`FromUser#_valueForDatabase` becomes the single delegation
`return SerializeCastValue.serialize(this.type!, this.value);`, mirroring
`attribute.rb:208`. The module's `serialize` should route through the exported
`itselfIfSerializeCastValueCompatible(type)` helper so the `rescue nil` arm is real,
and its parameter type must stop requiring `serializeCastValue` on the operand — the
whole point of the guard is that the operand may not have it.

Follow-through in the test suite: with the module arm restored, `InscribingType` in
`attribute.test.ts` can drop `extends ValueType` and become the bare class Rails
writes, keeping its four assertions unchanged.

## Acceptance criteria

- [ ] `FromUser#_valueForDatabase` calls `SerializeCastValue.serialize(type, value)`
      and holds no compatibility test of its own.
- [ ] `SerializeCastValue.serialize` falls through to `type.serialize(value)` for a
      type with no `itselfIfSerializeCastValueCompatible`, mirroring the
      `rescue nil` at `serialize_cast_value.rb:30`, with a test covering that arm.
- [ ] `pnpm parity:api:calls` shows the delegation restored and gains no baseline row.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_test.rb`.
