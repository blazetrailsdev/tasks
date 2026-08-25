---
title: "converge-time-zone-setter-through-find-zone-bang"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6218
claim: "2026-08-08T02:51:56Z"
assignee: "converge-time-zone-setter-through-find-zone-bang"
blocked-by: null
closed-reason: null
---

## Context

`Time.zone=` is the last member of `core_ext/time/zones.rb` that does not route
through `find_zone!`:

- Rails: `def zone=(time_zone) = IsolatedExecutionState[:time_zone] = find_zone!(time_zone)`
  (`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb:41-43`).
- trails: `setZone` (`packages/activesupport/src/time-zone-config.ts`) re-implements
  the resolution inline — `TimeZone.find` for a string, a bare `instanceof`
  arm for a TimeZone, and no Duration arm at all.

The blocker is `nil`: Rails stores `find_zone!(nil)` → `nil` in the zone slot,
where trails treats `setZone(null)` as "unset, fall through to `_zoneDefault`"
(`getZone` returns `_zoneDefault` when `_zone === undefined`). `false` has the
same problem — Rails stores it verbatim, trails folds it onto the unset path.
Converging `setZone` therefore means settling the `zone_default` fallthrough,
not just swapping in a call.

`find_zone` and `use_zone` in the same file were converged onto `findZoneBang`
by the RFC 0072 orphan-bucket slice (PR that added
`activesupport:core_ext/time/zones.rb` → `time-zone-config.ts`); the baseline row
for `zone=` / `find_zone!` in
`scripts/api-compare/call-mismatches-exclude/activesupport/time-zone-config.json`
is what this story deletes.

## Acceptance criteria

- `setZone` resolves its argument with `findZoneBang`, matching zones.rb:42.
- `Time.zone = nil` and `Time.zone = false` store the value Rails stores; the
  `zone_default` fallthrough is expressed the way Rails expresses it
  (`IsolatedExecutionState[:time_zone] || zone_default`, zones.rb:19-21).
- The `zone=` / `find_zone!` row is deleted from the call-mismatch baseline.
- `time-zone.test.ts` and `core-ext/time-with-zone.test.ts` stay green.
