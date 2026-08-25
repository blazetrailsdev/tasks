---
title: "::DateTime keeps its jd/df local, where ComplexDateData keeps them in UTC"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6154
claim: "2026-08-06T13:40:06Z"
assignee: "activemodel-type-time-returns-a-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6151 (`date-time-carries-no-utc-offset`), which gave
`::DateTime` its offset but kept the port's existing state shape.

Ruby's `::DateTime` is a `ComplexDateData` (`date_core.c:215-231`) holding the
Julian day and day-fraction **in UTC** plus `of`, the offset in seconds. Every
reader converts back on the way out — `m_local_jd` / `m_local_df` over
`jd_utc_to_local` / `df_utc_to_local` — and `dt_new_by_frags` converts in on the
way through (`jd_local_to_utc` / `df_local_to_utc`, `date_core.c:8311-8313`).

`packages/date/src/date.ts`'s `DateTime` instead stores the civil fields (via
`Date`) and `#hour`/`#min`/`#sec` **local**, with `#of` alongside. The readers
answer the same values either way, which is why this was left alone, but the
representation is not Ruby's and the divergence is already observable at one
point: a `24:00:00` time of day makes `df == 86400`, which Ruby's round-trip
normalizes into a day roll. PR #6151 hand-normalizes that single case in
`dtNewByFrags` rather than getting it from the representation, so any further
arithmetic that depends on the UTC pair — `DateTime#+`, `#-`, `#new_offset`
(`d_lite_new_offset`, `date_core.c:5931`), comparison across offsets — has no
correct substrate to build on.

## Converged shape

`DateTime` holds `jd` / `df` / `sf` in UTC plus `of`, as `ComplexDateData` does.
`#hour` / `#min` / `#sec` / the civil readers go through ported `m_local_jd` /
`m_local_df`; `dtNewByFrags` converts with `jd_local_to_utc` /
`df_local_to_utc` and drops the hand-written `rh === 24` normalization, which
falls out of the representation once it is right.

`#newStart` currently rebuilds the receiver because a TS subclass cannot be
dup'd through `Date`'s constructor; that stays, but it copies the UTC pair.

## Acceptance criteria

- [ ] `DateTime` stores the UTC Julian day / day-fraction and `of`, not local
      civil fields plus a local time of day.
- [ ] `m_local_jd` / `m_local_df` / `jd_local_to_utc` / `df_local_to_utc` are
      ported under their Rails names and the readers go through them.
- [ ] The `rh === 24` special case in `dtNewByFrags` is deleted, and its test
      (`date.trails.test.ts`, "rolls a 24:00:00 time of day onto the next day,
      as jd_local_to_utc does") still passes.
- [ ] Every existing `DateTime` test in `packages/date/src/date.trails.test.ts`
      passes unchanged.
