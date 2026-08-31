---
title: "Integer#cast_value should rescue to_i, not probe for callability"
status: done
updated: 2026-08-31
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: 7243
claim: "2026-08-30T14:57:57Z"
assignee: "integer-cast-value-is-a-rescue-not-a-probe"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Integer#cast_value` is a rescue, not a probe
(`activemodel/lib/active_model/type/integer.rb:89-91`):

```ruby
def cast_value(value)
  value.to_i rescue nil
end
```

Ruby calls `to_i` unconditionally and swallows whatever it raises — `NoMethodError`
for an object that has no `to_i`, `ArgumentError`/`FloatDomainError` for a String
or Float that cannot convert.

trails asks a different question (`packages/activemodel/src/type/integer.ts`):

```ts
const toI = (value as { toI?: unknown } | null)?.toI;
if (typeof toI === "function") return toI.call(value) as number;
return null;
```

It probes for callability first, so it diverges from Rails in both directions:
an object whose `to_i` exists but raises propagates here where Ruby returns
`nil`, and the `rescue`'s other arms are simply absent. The String and numeric
paths above it are handled separately, so this is the fall-through arm for
everything else.

PR #7208 briefly wrapped this in an `in` guard and reverted it on inspection —
the guard was not the port either, and the real gap is the missing rescue.

## Converged shape

```ts
try {
  return (value as { toI(): number }).toI();
} catch {
  return null;
}
```

i.e. call, and rescue to `null`. Check whether the arms above it (`typeof value
=== "string"` → `parseInt`, the bigint narrowing) are then redundant with what
`to_i` would do, and keep only what Rails keeps.

## Acceptance criteria

- [ ] `cast_value`'s fall-through arm calls `to_i` and rescues to `null`,
      mirroring `integer.rb:89-91`.
- [ ] An object whose `to_i` raises casts to `null` rather than propagating,
      covered by a test.
- [ ] `IntegerTypeTest` / the AR numeric-data suites green on all three lanes.
