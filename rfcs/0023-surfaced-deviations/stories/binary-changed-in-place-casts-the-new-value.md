---
title: "Type::Binary#changed_in_place? casts the new value where Rails compares it raw"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

Rails' `Type::Binary#changed_in_place?`
(`vendor/rails/activemodel/lib/active_model/type/binary.rb:35-38`) deserializes
only the OLD value and compares the new one as given:

```ruby
def changed_in_place?(raw_old_value, value)
  old_value = deserialize(raw_old_value)
  old_value != value
end
```

trails' `isChangedInPlace`
(`packages/activemodel/src/type/binary.ts:32-43`) adds a `this.cast(value)` step
and keeps the result in a local `cur` that has no Rails counterpart, then does a
byte-wise `Uint8Array` comparison in place of `!=`. PR #7172 renamed the
parameter to Rails' `value` and the local to `old_value`, but left the extra
cast and the hand-rolled comparison, both out of scope for a parameter-name
story.

The `cast` is a live behaviour difference, not just shape: a String assigned to
a binary attribute is compared against the deserialized old value AFTER being
cast to `Data` here, where Rails compares it raw.

## Converged shape

Drop the `cast` and the `cur` local; compare `oldValue` against `value`
directly. The byte-wise `Uint8Array` walk stands in for Ruby's `!=` on two
Strings — JS `!==` is identity on typed arrays — so it stays, but it belongs
inline in the single comparison Rails writes, with no intermediate.

## Acceptance criteria

- `isChangedInPlace(rawOldValue, value)` deserializes only `rawOldValue` and
  compares against `value` as given, at the Rails file:line above.
- `packages/activemodel/src/type/binary.test.ts` and
  `binary.trails.test.ts` stay green; read
  `vendor/rails/activemodel/test/cases/type/binary_test.rb` first if one fails —
  a test that depends on the cast is itself the divergence.
- `pnpm parity:api:calls` shows no new row (the removed `cast` call is a
  TS-only call, so it cannot create one).
