---
title: "decimal-cast-value-to-s-fallback"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Cut from `assertions-activemodel-type-cluster-fourth-pass`, which landed the
`value.to_d` half of `decimal.rb:73-77`'s else branch:

```ruby
else
  value.respond_to?(:to_d) ? value.to_d : cast_value(value.to_s)
end
```

`packages/activemodel/src/type/decimal.ts`'s `_castWithoutScale` now answers
`toD()` when the value defines it, but still returns `null` for everything
else, where Rails falls through to `cast_value(value.to_s)`. That fallback has
a wide blast radius: Rails answers `BigDecimal(0)` for `cast({})` and
`cast(:sym)` (verified with MRI: `{}.to_s.to_d == 0.0`), where trails answers
`null` — so a decimal attribute assigned a Hash currently reads back nil
instead of 0, and every AR test that leans on the nil is load-bearing until
this lands.

Land the `to_s` fallback and run the AR suite; expect fallout in decimal-column
casting, dirty tracking and validation tests.

## Acceptance criteria

- `_castWithoutScale`'s final arm is `cast_value(value.to_s)`, matching
  decimal.rb:73-77, with no `null` return in its place.
- The behavior is pinned by a test in `decimal.trails.test.ts` (Rails has no
  test for the fallback arm itself).
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no
  new baseline rows.
- No `pnpm parity:test` percent drop for activemodel or activerecord.
