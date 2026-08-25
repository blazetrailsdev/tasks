---
title: "port-time-with-zone-period"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6558 (RFC 0096 wave-4 naming burndown for activesupport). Two
`class: "naming"` rows on `packages/activesupport/src/time-with-zone.ts` cannot
converge as renames because `TZInfo::TimezonePeriod` is not ported.

Rails (`vendor/rails/activesupport/lib/active_support/time_with_zone.rb`):

    def dst?          # :94-96
      period.dst?
    end

    def zone          # :133-135
      period.abbreviation
    end

Both delegate to `period`, which `TimeWithZone#period` returns
(`@period ||= time_zone.period_for_utc(@utc)`). trails has no `period` method on
`TimeWithZone` at all (grep finds only an unrelated comment at
time-with-zone.ts:858) and instead calls the zone directly with an instant:

    get zone(): string { return this._timeZone.abbreviation(this._zoned.toInstant()); }  // :127-129
    dst(): boolean     { return this._timeZone.isDst(this._zoned.toInstant()); }          // :147-149

Every other Rails method that reads `period` (`utc_offset`, `formatted_offset`,
`period_for_...`) has the same shape in trails, so this is one cluster, not two
call sites.

## Acceptance criteria

- [ ] `TimeWithZone#period` exists and memoizes, mirroring
      time_with_zone.rb's `@period ||= time_zone.period_for_utc(@utc)`, backed by
      whatever the trails `TimeZone` can expose as a period object — or the port
      is `pnpm tasks block`ed with the specific blocker.
- [ ] `dst`/`zone` (and the other `period` readers in the same file) delegate to
      it, so the Rails receiver identifier appears at each call site.
- [ ] The two `time-with-zone.ts` naming rows clear in
      `pnpm parity:api:calls:args:report`, with no new `shape` rows.
- [ ] No baseline row added or widened.
- [ ] activesupport time/zone suites green on all three lanes.
