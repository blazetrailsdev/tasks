---
title: "converge-ar-timestamps-honor-time-travel"
status: ready
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails' ActiveRecord timestamp/touch path generates `created_at`/`updated_at`
(and `touch:`-named columns) from a **raw** clock that ignores
ActiveSupport-style time travel:

- `packages/activerecord/src/timestamp.ts:261`
  `currentTimeFromProperTimezone()` returns `Temporal.Now.instant()` directly
  (also `timestamp.ts:38,45`).
- The travel-aware clock — `currentTimeInstant()` in
  `packages/activesupport/src/time-travel.ts:51` — applies the
  `_frozenInstant` / `_timeOffsetNs` set by `travel()` / `travelTo()` /
  `freezeTime()` (`packages/activesupport/src/testing-helpers.ts:15-46`).

Because the AR timestamp path uses the raw `Temporal.Now.instant()` and not
`currentTimeInstant()`, `travel(1.second) { record.increment!(..., touch:) }`
has **no effect** on the touched timestamp — the value still comes from real
wall-clock time. Rails' `Time.current` (used by `_create_record` /
`_update_record` / `touch`) honors `travel`, so this is a fidelity divergence.

Consequence (surfaced in PR #3855 review): faithful ports of
`test_increment_with_touch_an_attribute_updates_timestamps` (persistence_test.rb:346),
`test_decrement_with_touch_updates_timestamps` (persistence_test.rb:522), and
their siblings drop Rails' `travel(1.second)` wrapper because it would be a
no-op. They instead rely on real wall-clock elapsing (a DB round-trip)
between fixture insert and the touch, with a strict `>` assertion on
ms-truncated epochs — a theoretical same-millisecond race that `travel` exists
to eliminate in Rails.

## Acceptance criteria

- [ ] `currentTimeFromProperTimezone()` (and the `timestamp.ts:38,45` create
      paths) resolve "now" through the ActiveSupport travel-aware clock
      (`currentTimeInstant()` / equivalent) so `travel`/`travelTo`/`freezeTime`
      affect AR-generated timestamps, matching Rails' `Time.current`.
- [ ] Restore Rails' `travel(1.second)` wrapper in the persistence.test.ts
      increment/decrement-with-touch ports (and the wave12 sibling
      `decrement with touch an attribute updates timestamps`) so the
      timestamp-moved assertions are deterministic.
- [ ] No regression in existing timestamp/touch tests (touch-later.test.ts,
      dirty.test.ts, etc.); `pnpm lint` + `node scripts/typecheck.mjs` clean.
