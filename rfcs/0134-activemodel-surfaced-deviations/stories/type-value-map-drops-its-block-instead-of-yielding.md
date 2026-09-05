---
title: "Type::Value#map drops its block instead of yielding"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
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

Surfaced in PR #7534 while converging `convert_time_to_time_zone` onto Rails'
`else` arm, which is `map(value) { |v| convert_time_to_time_zone(v) }`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:48`).

Rails' `ActiveModel::Type::Value#map` YIELDS
(`vendor/rails/activemodel/lib/active_model/type/value.rb`):

```ruby
def map(value) # :nodoc:
  yield value
end
```

trails' port (`packages/activemodel/src/type/value.ts:72-74`) does not:

```ts
map(value: T | null, _block: (value: unknown) => unknown): T | null {
  return value;
}
```

The block parameter is accepted and dropped — note the `_` prefix, which is the
tell. Every subtype that overrides `map` does call its block
(`postgresql/oid/range.ts:69-73` yields `begin` and `end`,
`postgresql/oid/array.ts` yields each element), so the divergence is confined to
the base, but the base is what a scalar subtype inherits.

The behavioural difference is real and reachable: for a scalar `DateTimeType`,
Rails' `convert_time_to_time_zone` falls into its `else` arm and re-enters
itself through the yield, whereas trails returns the value untouched. It also
silently swallows any other `map` caller's block. It is masked today because
`convert_time_to_time_zone`'s first two arms catch every value the AR type stack
actually routes here, so the difference only shows for a value that is neither
`acts_like?(:time)` nor `infinite?` — the same class of value for which Rails
would recurse.

## Converged shape

```ts
map(value: T | null, block: (value: unknown) => unknown): T | null {
  return block(value) as T | null;
}
```

Before flipping it, sweep the `map` call sites for callers relying on the
identity return — `time-zone-conversion.ts`'s `TimeZoneConverter#map`
(which delegates straight to `this._subtype.map`) is the one this PR touched,
and `attribute.ts` / the serializers are the others to check. A caller that
depends on the value coming back unchanged is depending on the bug, not on
Rails.

## Acceptance criteria

- [ ] `Value#map` yields, matching `activemodel/lib/active_model/type/value.rb`.
- [ ] The `_block` parameter is renamed `block` (the underscore was only ever
      marking the dropped argument).
- [ ] Call sites that relied on the identity return are converged, not
      special-cased.
- [ ] No test renames; AR type and time-zone lanes green on all three adapters.
