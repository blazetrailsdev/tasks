---
title: "AttributeSet's frozen backing store raises TypeError where Ruby's frozen Hash raises FrozenError"
status: done
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7525
claim: "2026-09-05T18:06:48Z"
assignee: "assertion-comparer-normalizes-snake-vs-camel-attribute-literals"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7506 while converging
`attribute-set-invented-assert-not-frozen-helper`, which deleted the invented
`assertNotFrozen()` helper and its three extra guards so that
`packages/activemodel/src/attribute-set.ts` raises where Rails raises and
nowhere else.

Rails guards exactly one writer explicitly
(`vendor/rails/activemodel/lib/active_model/attribute_set.rb:58-62`):

```ruby
def write_from_user(name, value)
  raise FrozenError, "can't modify frozen attributes" if frozen?
  @attributes[name] = self[name].with_value_from_user(value)
  value
end
```

The other three writers (`[]=` at `:20`, `write_from_database` at `:54-56`,
`write_cast_value` at `:64-66`) need no guard because `freeze`
(`attribute_set.rb:68-71`) freezes the underlying Hash:

```ruby
def freeze
  attributes.freeze
  super
end
```

so `@attributes[name] = ...` raises Ruby's own `FrozenError` from the Hash.

trails' `freeze()` mirrors that — `Object.freeze(this.attributes())` then
`Object.freeze(this)` — and the backing store is a plain null-prototype object,
so an assignment to it after `freeze()` does throw under ESM strict mode. But it
throws a **JS `TypeError`** ("Cannot add property x, object is not extensible"),
not ruby-compat's `FrozenError`. A caller that rescues `FrozenError` — the class
Ruby raises from both the explicit guard and the Hash — catches the
`writeFromUser` arm and misses the other three.

The deviation is the error CLASS only; the raise sites are now correct, and
re-adding a per-writer guard is explicitly the wrong fix (that is the deviation
PR #7506 removed).

## Converged shape

Make the frozen backing store raise `FrozenError` the way Ruby's frozen Hash
does, without re-introducing a guard at each writer. Options to weigh:

- Wrap `_attributes` in a `Proxy` whose `set`/`defineProperty` traps throw
  `FrozenError` once the set is frozen — one place, no per-writer guard, and it
  is the store that raises, exactly as in Ruby.
- Or have ruby-compat's `FrozenError` extend / be recognised alongside
  `TypeError` so a `catch (e) { if (e instanceof FrozenError) }` matches what
  the engine throws.

Prefer whichever keeps `attribute-set.ts`'s bodies byte-identical to
`attribute_set.rb:54-66` — the point of the story is that the writers stay
guard-free.

## Acceptance criteria

- [ ] Writing to a frozen `AttributeSet` through `set`, `writeFromDatabase` or
      `writeCastValue` raises ruby-compat's `FrozenError`, matching what Ruby's
      frozen Hash raises at `attribute_set.rb:55,65`.
- [ ] `writeFromUser` keeps its inline
      `throw new FrozenError("can't modify frozen attributes")`
      (`attribute_set.rb:59`) — the explicit guard Rails does have.
- [ ] No per-writer guard is added to the other three writers, and
      `assertNotFrozen` is not resurrected.
- [ ] A regression test freezes an `AttributeSet` and asserts `FrozenError` from
      each of the four writers; it fails on the baseline for three of them.
