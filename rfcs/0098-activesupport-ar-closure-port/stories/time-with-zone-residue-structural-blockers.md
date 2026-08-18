---
title: "time-with-zone-residue-structural-blockers"
status: blocked
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-14T22:49:42Z"
assignee: "retire-time-zone-config-test-only-zone-seams"
blocked-by: "Sections A, B-collision and D remain, each on its own undecided structural question; C and part of B landed in PR #6550. LANDED: (C) preserve_timezone / system_local_time? / active_support_local_zone were already ported by #6547 — core_ext/time/compatibility.rb reads 4/4. (B, cheap half) the five non-colliding date_time/conversions.rb members — civil_from_format, usec, nsec, offset_in_seconds, seconds_since_unix_epoch (conversions.rb:69-105) — plus the DateTime arms of sec_fraction and seconds_since_midnight (date_time/calculations.rb:20-22, whose body differs from the Time one); that file goes 20% -> 70%. NOT NEEDED: the story's marshal_dump / marshal_load acceptance criterion is already satisfied — they are a reasoned SCOPED_SKIP_GROUPS entry scoped to time_with_zone.rb (scripts/parity/conventions.ts:534-545), not bare missing rows. Do not add a global SKIP_GROUPS entry for them: it duplicates that one, silences both names outside time_with_zone.rb, and reds the 'SCOPED_SKIP_GROUPS never overlaps the global SKIP set' invariant (conventions.test.ts:452-456). STILL BLOCKED: (A) period / incorporate_utc_offset / get_period_and_ensure_valid_local_time / transfer_time_values_to_utc_constructor / wrap_with_time_zone all hinge on the four-argument TimeWithZone.new(utc_time, time_zone, local_time, period) (time_with_zone.rb:56) and a TZInfo::TimezonePeriod value; trails' constructor is (instant, timeZone) and delegates DST to Temporal.ZonedDateTime. Needs the decision on whether TimeZone grows period_for_utc / periods_for_local and a Period type before any of the five can be written. (B, collision) to_formatted_s / readable_inspect / default_inspect are three different Ruby methods on three classes collapsing onto one TS name each in the shared time-ext.ts; needs the decision to split time-ext.ts by receiver (the Rails layout parity:api matches on) first — that move is the prerequisite, not the work. (D) the acts_like markers must reach the value's actual prototype: DateTime.parse returns Temporal.PlainDateTime | ZonedDateTime, never an instance of a class activesupport can reopen, so #6465's class-at-the-Rails-path attempt was inert. Needs the decision between installing markers on the Temporal polyfill prototypes at import time (a global side effect on a third-party package, and PlainDateTime is not only ever a DateTime) and moving them into @blazetrails/date (giving up the Rails file path)."
closed-reason: null
---

## Re-scope (2026-08-18)

This story carried three independent arms. Two have been split out and are no
longer blocked; **this story is now arm (D) only** — where the `acts_like`
markers live.

| arm                                                                          | disposition                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (A) `TimeWithZone` four-arg ctor + `TimeZone` period lookups                 | **Split out.** Its blocking premise was stale: `TimezonePeriod` (`values/time-zone.ts:543`) and `periodForUtc` (`:1076`) already landed, so "does TimeZone grow a Period type" is answered — it did. Now `port-time-zone-local-period-lookups` (ready) + `widen-time-with-zone-ctor-onto-rails-four-argument-shape` (deps on it). 9 members. |
| (B) `to_formatted_s` / `readable_inspect` / `default_inspect` collision      | **Split out** as `split-time-ext-by-receiver-onto-the-rails-layout` (ready). Not a judgement call: `parity:api` matches on the Rails layout and `time-ext.ts` hosts four Rails files across three receivers. 2 members.                                                                                                                      |
| (C) `preserve_timezone` / `system_local_time?` / `active_support_local_zone` | Already landed in #6547.                                                                                                                                                                                                                                                                                                                     |
| (D) `acts_like` markers                                                      | **Stays here, still blocked.** 1 member (`acts_like_time?`).                                                                                                                                                                                                                                                                                 |

## The remaining question

`Date#acts_like_date?` / `Time#acts_like_time?` are markers Rails defines by
reopening `Date` and `Time`. trails cannot reopen its equivalents: `DateTime.parse`
returns `Temporal.PlainDateTime | Temporal.ZonedDateTime`, never an instance of
a class activesupport owns. PR #6465 put the marker on a class at the Rails
path, which was inert — nothing the parser returns is an instance of it.

Two admissible resolutions, neither obviously right:

1. **Install the markers on the Temporal polyfill prototypes at import time.**
   Keeps the Rails file path, so `parity:api` credits the member where Rails
   defines it. Costs a global side effect on a third-party package, and
   overstates the mapping — a `PlainDateTime` is not only ever a `DateTime`.
2. **Move the markers into `@blazetrails/date`,** where the values are
   constructed. Honest about ownership and side-effect-free, but gives up the
   Rails file path, so the member is credited at a path Rails does not have —
   or not credited at all.

A third option worth pricing before choosing either: **decide the marker has no
faithful trails counterpart** and record it in `SCOPED_SKIP_GROUPS` with that
reason. That is only admissible if `acts_like?` genuinely cannot be answered —
not merely because both ports are awkward — and it lowers 0098's reachable
ceiling by 1 member, which must be stated in the RFC rather than absorbed.

## Acceptance criteria

- [ ] One of the three resolutions above is chosen and recorded in RFC 0098,
      with the reason at the call site if code lands.
- [ ] `Time#acts_like_time?` is either credited by `pnpm parity:api` or carries
      a reasoned `SCOPED_SKIP_GROUPS` entry naming this decision.
- [ ] Whatever ships is exercised through a value the parser actually returns —
      not through a class instance nothing constructs, which is how #6465 came
      to be inert.
- [ ] If option 1: the import-time side effect is confined to one module and
      documented as a deliberate global, and the `PlainDateTime`-is-not-a-
      `DateTime` overstatement is stated where the marker is installed.
- [ ] `pnpm parity:api:extra` clean; no new baseline rows.
