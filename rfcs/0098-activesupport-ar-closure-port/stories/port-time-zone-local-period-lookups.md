---
title: "Port TimeZone's local-side period lookups and UTC conversions"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: 6733
claim: "2026-08-19T00:11:25Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Five `TimeZone` members from
`vendor/rails/activesupport/lib/active_support/values/time_zone.rb` are absent
from `packages/activesupport/src/values/time-zone.ts`: `period_for_local`,
`periods_for_local`, `utc_to_local`, `local_to_utc`, `find_tzinfo`.

**The decision this was blocked on is already answered.** The parent story
`time-with-zone-residue-structural-blockers` recorded arm (A) as _"Needs the
decision on whether TimeZone grows period_for_utc / periods_for_local and a
Period type before any of the five can be written."_ Both halves have since
landed:

- `TimezonePeriod` is a real class — `values/time-zone.ts:543`, carrying
  `abbreviation`, `observedUtcOffset` and a private `_dst`.
- `TimeZone#periodForUtc` exists — `values/time-zone.ts:1076`, returning it.
- `TimeWithZone` already memoizes through it — `time-with-zone.ts:125-127`,
  `get period()` → `this._timeZone.periodForUtc(utc)`.

So the Period type exists and the UTC-side lookup exists. What is missing is the
**local-side** lookup and the two conversions, which is porting work, not a
design decision.

## Scope

Port, with Rails names and bodies, against `time_zone.rb`:

| member            | Rails                                                                              | note                                |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `periodsForLocal` | delegates to `tzinfo.periods_for_local`                                            | returns the ambiguous-local list    |
| `periodForLocal`  | wraps `periods_for_local` with the DST-ambiguity resolution                        | Rails' block/`dst` arg semantics    |
| `utcToLocal`      | `tzinfo.utc_to_local`, then the `utc_to_local_returns_utc_offset_times` config arm | read the config arm, do not drop it |
| `localToUtc`      | `tzinfo.local_to_utc`                                                              |                                     |
| `findTzinfo`      | the `TZInfo::Timezone.get` lookup behind `MAPPING`                                 |                                     |

`utc_to_local`'s framework-defaults arm is the trap: Rails branches on
`ActiveSupport.utc_to_local_returns_utc_offset_times`, and dropping the branch
silently changes what every ambiguous local time answers.

Out of scope: the four-argument `TimeWithZone` constructor and its private
helpers — that is
`widen-time-with-zone-ctor-onto-rails-four-argument-shape`, which depends on
this story.

## Acceptance criteria

- [ ] All five members ported at their Rails names on `TimeZone`, bodies
      matching `time_zone.rb` branch-for-branch.
- [ ] `utcToLocal` carries the `utc_to_local_returns_utc_offset_times` arm, with
      a test covering both settings.
- [ ] `periodForLocal` resolves DST ambiguity the way Rails does — both the
      ambiguous and the nonexistent-local-time cases — rather than picking the
      first period.
- [ ] `pnpm parity:api` AR-closure rollup rises by 5 (baseline 8917/8943,
      99.7%, measured 2026-08-18).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      baseline rows.
