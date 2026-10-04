---
title: "StringType#isChangedInPlace and ImmutableStringType#castValue carry arms and freeze calls Rails does not have"
status: ready
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while writing CLAUDE.md § "Ruby Strings are JS string primitives"
(trails#8467). Two string-type bodies carry arms and calls Rails does not have.
Neither is forced by the string-primitive ratification: both converge.

**`StringType#isChangedInPlace`** (`packages/activemodel/src/type/string.ts:5-9`):

```ts
if (typeof newValue !== "string") return false;
if (rawOldValue === null || rawOldValue === undefined) return true;
return rawOldValue !== newValue;
```

Rails (`activemodel/lib/active_model/type/string.rb:16-20`):

```ruby
def changed_in_place?(raw_old_value, new_value)
  if new_value.is_a?(::String)
    raw_old_value != new_value
  end
end
```

- The `rawOldValue === null || undefined` arm is invented. It is also
  redundant: `null !== "x"` is already `true`.
- Rails' guard is positive (`if new_value.is_a?(::String)`) and the method
  answers `nil` otherwise; the port inverts the guard and answers `false`.
- Rails compares with `!=` (`String#==`); the converged spelling is
  `!rbEqual(rawOldValue, newValue)`.

**`ImmutableStringType#castValue`**
(`packages/activemodel/src/type/immutable-string.ts:48-53`):

```ts
if (value === true) return Object.freeze(this.true);
if (value === false) return Object.freeze(this.false);
const str = String(value);
return Object.freeze(str);
```

Rails (`activemodel/lib/active_model/type/immutable_string.rb:62-68`):

```ruby
case value
when true then @true
when false then @false
else value.to_s.freeze
end
```

- The `true` / `false` arms make no `freeze` call in Rails; `@true` / `@false`
  are interned once in `initialize` (`:39-40`, `-(…)`).
- `value.to_s` is ported as `String(value)`; check it against the repo's
  settled `to_s` spelling (compare `StringType#castValue`'s `else` arm,
  `string.ts:26`, which has the same shape).

## Acceptance criteria

- [ ] `StringType#isChangedInPlace` has Rails' single `if new_value.is_a?(::String)`
      guard, no `rawOldValue` nil arm, and answers `null`/`undefined` (Ruby `nil`)
      when the guard fails, with callers checked for the falsy value.
- [ ] `ImmutableStringType#castValue`'s `true` / `false` arms return `this.true` /
      `this.false` with no `freeze` call; only the `else` arm freezes.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:arms:throws`
      are green, with any row this converges deleted by hand.
- [ ] `type/string.test.ts`, `type/immutable-string.test.ts`, `attribute.test.ts`
      and `attributes-dirty.test.ts` pass.
