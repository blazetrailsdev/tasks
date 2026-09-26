---
title: "toZonedDateTime's sub-minute seat reports the truncated offset and wall-clock-derived results"
status: draft
updated: 2026-09-26
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SubMinuteOffsetZonedDateTime` (`packages/date/src/time.ts`, the seat
`Time#toZonedDateTime` answers for a sub-minute `utc_offset`) now carries the
receiver's true instant, with a wall-clock twin backing the members in
`SUB_MINUTE_WALL_CLOCK_MEMBERS` (trails#8120). The seat's zone is the
minute-truncated offset (`of2str`, `packages/date/src/date.ts`), so `offset`
and `offsetNanoseconds` still answer `-00:44` / `-2640e9` for a `-00:44:30`
receiver, and `instant + offsetNanoseconds` no longer equals the wall clock the
seat reports.

MRI's `Time#utc_offset` is exact (`vendor/ruby/time.c` `time_utc_offset`):
`Time.new("2013-09-04 03:00:00 -00:44:30").utc_offset` is `-2670`.

## Acceptance criteria

- [ ] For a `-00:44:30` receiver, `toZonedDateTime().offsetNanoseconds` is
      `-2670_000_000_000n` and `offset` is `"-00:44:30"`.
- [ ] `with`, `withPlainTime`, `round` and `startOfDay` on the seat answer
      results consistent with the reported wall clock.
- [ ] Tests in `packages/date/src/time.trails.test.ts`.
