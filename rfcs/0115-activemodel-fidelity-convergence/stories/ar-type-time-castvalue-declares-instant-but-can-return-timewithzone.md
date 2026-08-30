---
title: "AR Type::Time#castValue declares Instant but can return a TimeWithZone"
status: draft
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7224 (RFC 0115,
`fix-time-column-write-back-drops-time-with-zone`).

`ActiveRecord::Type::Time#cast_value`
(`vendor/rails/activerecord/lib/active_record/type/time.rb:25-30`) is

```ruby
def cast_value(value)
  case value = super
  when Value
    value.__getobj__
  else
    value
  end
end
```

`Value` is `DelegateClass(::Time)`, so `__getobj__` yields any Ruby time-like.
In trails, `Value` now legitimately wraps `Temporal.Instant | TimeWithZone`
(PR #7224 widened it so `serialize` / `serializeCastValue` can carry a
`TimeWithZone`, mirroring `type/time.rb:12-21`), and
`ActiveModel::Type::Time#cast_value`'s non-string arm is
`apply_seconds_precision(value)`
(`vendor/rails/activemodel/lib/active_model/type/time.rb:66`), which passes a
`TimeWithZone` through unchanged.

So `packages/activerecord/src/type/time.ts:40-45` reads

```ts
protected override castValue(value: unknown): Temporal.Instant | null {
  const cast: unknown = super.castValue(value);
  return cast instanceof Value
    ? (cast.getobj() as Temporal.Instant)
    : (cast as Temporal.Instant | null);
}
```

Both `as` casts are type-level fibs: the declared `Temporal.Instant | null` is
false whenever the value is a `TimeWithZone`. Harmless at runtime today (every
consumer of a cast `time` attribute already handles a `TimeWithZone`, which is
what the DST test exercises), but it hides the real union from `tsc`.

## Acceptance criteria

- [ ] `ActiveRecord::Type::Time#castValue` declares the union it can actually
      return (`Temporal.Instant | TimeWithZone | null`) with no `as` cast, or
      the narrowing is proven correct and the cast removed.
- [ ] The widening is threaded through `TimeType`'s
      `ValueType<Temporal.Instant>` generic in
      `packages/activemodel/src/type/time.ts` rather than re-asserted at each
      call site.
- [ ] `pnpm typecheck` clean; `pnpm parity:api:calls` /
      `pnpm parity:api:calls:args` deltas non-negative.
