---
title: "Time#change's zone arms and DST fold selection"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6198
claim: "2026-08-07T20:08:49Z"
assignee: "polymorphic-reference-type-column-comes-first"
blocked-by: null
closed-reason: null
---

## Context

PR #6190 renamed `time-ext.ts`'s `changeDate` to its Rails name, `change`.
Matching the Rails name made `parity:api` compare the body against
`Time#change` for the first time, which surfaced two calls the TS body does not
make — a pre-existing divergence that was invisible while the function carried
an invented name, now baselined as the `change -> local` and
`change -> integer?` rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`.

`Time#change`
(`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:123-188`)
branches on the receiver's zone after computing the six components:

- `:150` — `elsif zone.respond_to?(:utc_to_local)` builds through
  `::Time.new(..., zone)` and then, at `:156-158`, repairs a Ruby bug via
  `new_time.utc_offset.integer?`.
- `:160-171` — the DST-ambiguity fixup, comparing `new_time.utc_offset` against
  the receiver's `utc_offset` and fast-forwarding by the difference so `change`
  picks the occurrence matching the receiver's offset.
- `:173` — `elsif zone` falls back to `::Time.local(...)`.

`time-ext.ts`'s `change` takes a JS `Date`, which carries no zone object and no
per-value UTC offset (only the host's `getTimezoneOffset()`), so none of those
three arms is reachable and the body always takes the equivalent of the final
`::Time.new(..., utc_offset)` branch. The consequence is real, not cosmetic:
around a DST fall-back, `change` cannot select the occurrence matching the
receiver's offset the way Rails does.

## Converged shape

Give `change` a zoned receiver so the zone arms exist. `Temporal.ZonedDateTime`
carries both the time zone and the offset, and `disambiguation: "compatible"` /
`"earlier"` / `"later"` expresses exactly the fold-ambiguity choice
`:160-171` hand-rolls. Route `change` over `TimeWithZone` /
`Temporal.ZonedDateTime` and keep the plain-`Date` entry point as the
zone-less arm, mirroring Rails' final `else`.

Related: RFC 0088-date-gem-port already moved `TimeWithZone` onto the date
package.

## Acceptance criteria

- [ ] `change` reaches a zone-aware branch when the receiver carries a zone,
      matching `time/calculations.rb:150-174`, including the DST fold selection
      at `:160-171`.
- [ ] A test covers a `change` across a DST fall-back where two nominal times
      exist and asserts the occurrence matching the receiver's offset wins.
- [ ] The `change -> local` and `change -> integer?` rows are DELETED from
      `call-mismatches-exclude/activesupport/time-ext.json` by hand
      (only-shrink; no `--write` reseed).
- [ ] `pnpm parity:api:calls` green.
