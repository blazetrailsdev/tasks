---
title: "Port TimeZone#<=> instead of inlining its comparator in all()"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6236
claim: "2026-08-08T14:15:58Z"
assignee: "retire-module-level-find-target-engine-exports"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::TimeZone#<=>` is not ported
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:333-337`):

```ruby
def <=>(zone)
  return unless zone.respond_to? :utc_offset
  result = (utc_offset <=> zone.utc_offset)
  result = (name <=> zone.name) if result == 0
  result
end
```

PR #6232 needed the ordering for `all()` (`zones_map.values.sort`,
`time_zone.rb:224`, whose order is behavioral — `[]`'s Numeric arm returns the
_first_ zone at the requested offset) and inlined the comparator in `all()`
rather than porting the method. `TimeZone` also includes `Comparable`
(`time_zone.rb:20`), so `<`/`>`/`==` between zones are Rails API that trails
does not answer at all; `test_all_sorted` (`time_zone_test.rb`) asserts
`all[i - 1] < all[i]`, which our port has to spell out longhand.

Note the operators table in `docs/ruby-ts-conventions.md` maps `<=>` to a named
method — `TimeWithZone` already spells its port `compareTo`, so that is the
name to use here.

## Converged shape

- Port `<=>` as `TimeZone#compareTo(zone)`, same two-step comparison and the
  `respond_to? :utc_offset` guard's TS analogue.
- `all()` sorts with it instead of the inlined comparator.
- `test_all_sorted` asserts through `compareTo`.

## Acceptance criteria

- `TimeZone.prototype.compareTo` exists, ordering by `utcOffset` then `name`.
- `all()` has no inline comparator.
- `time-zone.test.ts` stays green.
