---
title: "TimeZone#local hand-rolls the DST search the ported local_to_utc now does"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6733, which gave `TimeZone` a `Timezone` stand-in for
`TZInfo::Timezone` and ported `period_for_local` / `periods_for_local` /
`local_to_utc` (`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:550-565`).

`TimeZone#local` (`packages/activesupport/src/values/time-zone.ts`) predates
those members and is a hand-rolled ambiguity search: it guesses a UTC instant
from `getZoneInfo`, checks whether the local components round-trip, retries
with the offset at the first candidate, and falls through to "use the earlier
UTC" for a spring-forward gap. Rails' `local` (`time_zone.rb:439-443`) builds
`Time.utc(...)` from the parts and hands it to `TimeWithZone.new(nil, self,
time)`, whose `utc` (`time_with_zone.rb::642`) resolves the local time through
`period_for_local` / `local_to_utc` — one path, the same one the new members
now provide.

## Converged shape

`local` builds the wall-clock time and lets the `TimeWithZone` local-time
constructor resolve it through `localToUtc`/`periodForLocal`, deleting the
bespoke two-candidate search and its gap fallback. The DST-gap and ambiguity
policy then comes from one place instead of two that can disagree.

Depends on `widen-time-with-zone-ctor-onto-rails-four-argument-shape` (the
`TimeWithZone.new(nil, zone, local_time)` arm).

## Acceptance criteria

- [ ] `TimeZone#local` has no bespoke candidate search; it resolves through the
      ported `local_to_utc` / `period_for_local`.
- [ ] `TimeZoneTest` and `TimeWithZoneTest` stay green on all lanes, including
      the existing ambiguous-time and DST-gap cases.
- [ ] `pnpm parity:api:calls` / `:args` green; no new baseline rows.
