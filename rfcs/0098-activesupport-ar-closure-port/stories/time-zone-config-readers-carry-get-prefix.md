---
title: "time-zone-config-readers-carry-get-prefix"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6547
claim: "2026-08-14T21:41:01Z"
assignee: "converge-activesupport-module-deprecator-and-gem-version"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activesupport` now scores
`packages/activesupport/src/time-zone-config.ts` against
`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb`
(PR for `time-zone-config-has-no-mapped-rails-counterpart` made the reopening
file own a bucket). It reports 5 novel extras that were previously invisible
behind `[no Rails counterpart]`:

```text
time-zone-config.ts — 5 novel, 1 moved
  dateInTimeZone  getZone  getZoneDefault  isZoneExplicit  resetZone   (novel)
  current                                                              (moved)
```

Each is a real divergence, not a tool artifact:

- `getZone` / `getZoneDefault` are Ruby's bare readers `Time.zone`
  (`zones.rb:13-15`) and `Time.zone_default` (`attr_accessor :zone_default`,
  `zones.rb:10`). The `setX()` idiom exists because a Ruby `x=` that must be
  async has no TS spelling; a _reader_ has one, so the `get` prefix is not
  earned. `setZone` already matches (it credits `zone=`).
- `isZoneExplicit` and `resetZone` have no Ruby counterpart at all — they are
  test-teardown seams over the module-level `_zone` slot.
- `dateInTimeZone` is `Date#in_time_zone`
  (`core_ext/date_and_time/zones.rb:9`) under a trails-invented name.
- `current` is `moved`: `Time.current` really is declared in
  `core_ext/time/calculations.rb:38` in this Rails, not in `zones.rb`, so it
  is measured against `time-ext.ts`'s bucket. Check whether it belongs there.

## Converged shape

Rename the readers to the Rails names (`zone()`, `zoneDefault()`), give
`dateInTimeZone` the `inTimeZone` name its Ruby counterpart has (checking for
a collision with `time-ext.ts`'s `Time#in_time_zone` port first — they are
different receivers), and either fold the two test seams into the ported
surface or tag them `@noRailsEquivalent` with a reason.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package activesupport` reports fewer novel extras on
      `time-zone-config.ts` than the 5 above; anything left carries a
      `@noRailsEquivalent <reason>` with a permanence claim.
- [ ] Every renamed reader keeps its call sites working across activesupport,
      activerecord and actionpack.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas are non-negative.
