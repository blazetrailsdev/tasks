---
title: "Retire time-zone-config's resetZone / isZoneExplicit test seams"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6550
claim: "2026-08-14T22:49:42Z"
assignee: "retire-time-zone-config-test-only-zone-seams"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-zone-config.ts` (the `core_ext/time/zones.rb`
bucket) exports two functions with no Ruby counterpart, tagged
`@noRailsEquivalent CONVERGEABLE` by PR #6547:

- `resetZone()` — sets the module-level `_zone` slot back to `undefined`.
- `isZoneExplicit()` — reports whether that slot is set.

Rails' teardown for the same job is `Time.zone = nil`
(`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb:13-15`,
`:41-43`: the reader is `IsolatedExecutionState[:time_zone] || zone_default`,
so a stored `nil` falls through to `zone_default` exactly as an absent key
does). trails already spells that as `setZone(null)`, and `zone()` itself does
not observe the difference between a stored `null` and an absent key — the
distinction exists only for these two seams.

They were left in place in #6547 because retiring them is a sweep over ~30
call sites, almost all in activerecord tests:
`packages/activerecord/src/test-helper.ts:8,39,64,68`,
`packages/activerecord/src/cases/helper.ts:20-21,225,230,237`, plus
`adapters/postgresql/{infinity,range,array}.test.ts`,
`attribute-methods/time-zone-converter.test.ts`,
`type/date-time.trails.test.ts` and `test-helper.test.ts`.

## Converged shape

Replace every `resetZone()` with `setZone(null)`; replace the
`isZoneExplicit()` save/restore pairs in `test-helper.ts` and `cases/helper.ts`
with saving `zone()` and restoring it through `setZone`. Delete both functions
and their barrel exports from `packages/activesupport/src/index.ts`, and delete
`test-helper.test.ts`'s assertions on `isZoneExplicit`.

## Acceptance criteria

- [ ] `resetZone` / `isZoneExplicit` are gone from `time-zone-config.ts` and the
      barrel; no `@noRailsEquivalent` tag survives for them.
- [ ] `pnpm parity:api:extra --package activesupport` reports 0 novel on
      `time-zone-config.ts`, with 2 fewer allowed tags.
- [ ] activerecord's zone-sensitive suites stay green.
