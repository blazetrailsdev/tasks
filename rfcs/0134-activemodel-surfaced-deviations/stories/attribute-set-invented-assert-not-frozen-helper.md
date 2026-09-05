---
title: "AttributeSet's assertNotFrozen helper guards three writers Rails does not guard"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7506
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-set.ts` has a private
`assertNotFrozen()` helper (line 174) called from four writers — lines 52, 96,
115 and 139 (`writeFromDatabase`, `writeCastValue` and two siblings) — that
raises `FrozenError("can't modify frozen AttributeSet")`.

Rails' `AttributeSet` has neither the helper nor three of the four guards.
`vendor/rails/activemodel/lib/active_model/attribute_set.rb:54-66`:

```ruby
def write_from_database(name, value)
  @attributes[name] = self[name].with_value_from_database(value)
end

def write_from_user(name, value)
  raise FrozenError, "can't modify frozen attributes" if frozen?
  @attributes[name] = self[name].with_value_from_user(value)
  value
end

def write_cast_value(name, value)
  @attributes[name] = self[name].with_cast_value(value)
end
```

Exactly one writer guards — `write_from_user` — and it raises inline, not
through a helper, with the message `"can't modify frozen attributes"`. Our
`writeFromUser` already matches that line verbatim (PR #7399 converged it from
a relabelled plain `Error` to ruby-compat's `FrozenError`). The extra helper
and its three extra call sites are invented surface with an invented message:
`"can't modify frozen AttributeSet"` appears nowhere in Rails.

The reason Rails needs no guard on the others is `freeze`
(`attribute_set.rb:68-71`) freezes the underlying `attributes` hash, so a
`@attributes[name] = ...` on a frozen set raises Ruby's own `FrozenError`
from the Hash. `Object.freeze(this)` in our `freeze` does the same for the
`Map`-less field write — but our `_attributes` is a `Map`, whose `set` is
unaffected by `Object.freeze`, which is what the helper was papering over.

## Acceptance criteria

- `assertNotFrozen()` is deleted, along with its three non-`writeFromUser`
  call sites, so `attribute-set.ts` has one frozen check at the one line
  Rails has one.
- `writeFromUser` keeps its inline
  `throw new FrozenError("can't modify frozen attributes")`, mirroring
  `attribute_set.rb:59`.
- If the `Map` semantics genuinely leave a frozen `AttributeSet` writable
  where Ruby's frozen Hash would raise, converge `freeze()` to reproduce the
  Hash's behaviour (`attribute_set.rb:68-71` `attributes.freeze; super`) —
  e.g. by freezing the backing store rather than by re-adding per-writer
  guards. The guard is the deviation; the write-through is the thing to fix.
- `pnpm parity:api:extra --package activemodel` no longer reports
  `assertNotFrozen`.
