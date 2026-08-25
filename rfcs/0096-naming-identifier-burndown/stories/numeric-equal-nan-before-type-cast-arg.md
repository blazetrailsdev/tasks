---
title: "numeric-equal-nan-before-type-cast-arg"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6513
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/type/helpers/numeric.ts` `isChanged` calls
`isEqualNan(oldValue, newValue)`. Rails
(`vendor/rails/activemodel/lib/active_model/type/helpers/numeric.rb:31-34`)
calls `equal_nan?(old_value, new_value_before_type_cast)` — the RAW value, not
the cast one:

```ruby
def changed?(old_value, _new_value, new_value_before_type_cast) # :nodoc:
  (super || number_to_non_number?(old_value, new_value_before_type_cast)) &&
    !equal_nan?(old_value, new_value_before_type_cast)
end
```

`equal_nan?` (numeric.rb:37-42) then checks
`old_value.instance_of?(new_value.class)`, so with a raw `"NaN"` String and a
cast `Float::NAN` old value the guard is FALSE in Rails and the attribute reads
as changed.

trails passes the cast value instead, which makes that case read as unchanged.
The divergence is enshrined by
`packages/activemodel/src/type/float.test.ts`'s
`isChanged returns false for NaN-to-NaN when raw is "NaN" string — equal_nan?
uses cast value`, so converging means deciding that test's fate as well: it is a
trails-authored assertion (no Rails counterpart exists — `grep -rn nan
vendor/rails/activemodel/test/cases/type/` finds only integer_test.rb:35).

Surfaced by RFC 0096 wave 3 (`naming-burndown-3-arel-activemodel`); the call
site carries a `DIVERGENCE (a1)` comment naming this story. It also keeps one
`naming` call-argument row standing in `type/helpers/numeric.ts`.

## Acceptance criteria

- [ ] `isChanged` passes `newValueBeforeTypeCast` to `isEqualNan`, matching
      numeric.rb:33.
- [ ] The `float.test.ts` NaN/raw-string case either moves to the Rails answer
      or is shown, with an MRI run, to be what Rails actually does — the
      `DIVERGENCE (a1)` comment at the call site comes out either way.
- [ ] `pnpm parity:api:calls:args:report` shows the `numeric.ts` `naming` row
      retired, with no new `shape` row.
