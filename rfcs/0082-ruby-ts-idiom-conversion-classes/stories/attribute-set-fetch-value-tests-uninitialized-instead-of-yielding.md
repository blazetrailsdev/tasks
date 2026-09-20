---
title: "AttributeSet#fetch_value type-tests Uninitialized instead of forwarding the block to Attribute#value"
status: draft
updated: 2026-09-20
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

Surfaced converging `attribute_set_test.rb` and `attribute_test.rb` in trails#7899.

Rails' `AttributeSet#fetch_value` is one delegation
(`activemodel/lib/active_model/attribute_set.rb:50-52`):

```ruby
def fetch_value(name, &block)
  self[name].value(&block)
end
```

The block never belongs to the set — it is forwarded to the attribute, and only
`Attribute::Uninitialized#value` does anything with it
(`activemodel/lib/active_model/attribute.rb:241-246`):

```ruby
def value
  if block_given?
    yield name
  end
end
```

Every other `Attribute` subclass ignores the block and returns its value.

trails inverts the responsibility. `AttributeSet#fetchValue`
(`packages/activemodel/src/attribute-set.ts:94-100`) asks the attribute what class
it is and applies the block itself:

```ts
fetchValue(name: string, block?: (name: string) => unknown): unknown {
  const attr = this.getAttribute(name);
  if (block !== undefined && attr instanceof Uninitialized) {
    return block(name);
  }
  return attr.value;
}
```

and `LazyAttributeSet#fetchValue` (`attribute-set/builder.ts:71-98`) repeats the
same `instanceof Uninitialized` test twice more, so one Rails line becomes three
copies of a type test Rails does not make. Consequences:

- `Uninitialized#value` (`attribute.ts:328-330`) is a getter that takes no block and
  returns `undefined`, so the yield-the-name behaviour is unreachable from the
  attribute. `attribute_test.rb:184-190` ("uninitialized attributes yield their name
  if a block is given to value") asserts it directly on the Attribute; the converged
  trails body in `attribute.test.ts` has to route through a throwaway `AttributeSet`
  to reach the block at all.
- A future `Attribute` subclass that wants the block cannot get it — the set decides.
- `Uninitialized#value` answering `undefined` where Ruby answers `nil` forces
  `toBeUndefined()` where Rails writes `assert_nil` (`attribute_set_test.rb:157-160`,
  `:183-196`).

### Converged shape

`fetchValue` in BOTH `attribute-set.ts` and `attribute-set/builder.ts` becomes the
single delegation `return this.getAttribute(name).value(block)`, and the block test
moves onto `Uninitialized`. The blocker is that `value` is a property in trails, not
a method — a getter cannot take a block. The settled trails idiom for a Ruby reader
that must take an argument is a named method beside it (CLAUDE.md § "Generated
attribute readers are properties" for the reader half, and the `setX()` rule for the
inverse), so the shape to try first is an `Uninitialized`-aware `value` accessor plus
a block-taking sibling that `fetchValue` delegates to, keeping the type test in ONE
place — on the attribute, where Rails has it — rather than three.

Fix `Uninitialized#value`'s `undefined` → `null` in the same change, or split it out
if the blast radius across `AttributeSet#toHash` / `keys` / dirty tracking is large.

## Acceptance criteria

- [ ] `AttributeSet#fetchValue` and `LazyAttributeSet#fetchValue` no longer test
      `attr instanceof Uninitialized`; the block reaches the attribute.
- [ ] The block-handling arm lives on `Attribute::Uninitialized`, mirroring
      `attribute.rb:241-246`.
- [ ] `attribute.test.ts`'s "uninitialized attributes yield their name if a block is
      given to value" asserts against `Attribute.uninitialized(...)` directly, with
      no `AttributeSet` in the body, and its two assertions are unchanged.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_test.rb` and `attribute_set_test.rb`.

Child instance of `track-getter-vs-method-shape` in this RFC, whose AC asks for
divergent sites to be "fixed or registered as child stories here".
