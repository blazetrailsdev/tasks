---
title: "time-with-zone-residue-structural-blockers"
status: ready
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `time-with-zone-and-duration-residue` after PR #6465, which landed
27 of the 48 members `pnpm parity:api --package activesupport` reported missing
across that story's 11 files (3 new files created; activesupport overall
1294 → 1321 matched, AR closure 687 → 714).

The story estimated ~45 members / ~250 LOC. The real figure was 48 members over
11 files, and the LOC ceiling was waived by the maintainer mid-flight. The 21
below were left out because each has a **structural blocker**, not because of
volume — they should not be picked up as a straight "port the rest" task
without deciding the questions named here first.

### A. TZInfo `Period` cluster — `time_with_zone.rb` (5)

`period`, `incorporate_utc_offset`, `get_period_and_ensure_valid_local_time`,
`transfer_time_values_to_utc_constructor`, `wrap_with_time_zone`
(`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:72-74`,
`:562-602`).

All five hinge on Rails' four-argument constructor
`TimeWithZone.new(utc_time, time_zone, local_time = nil, period = nil)`
(`time_with_zone.rb:56`) and on a `TZInfo::TimezonePeriod` object.
`packages/activesupport/src/time-with-zone.ts:93` is `constructor(instant:
Temporal.Instant, timeZone: TimeZone)` and delegates all period/DST logic to
`Temporal.ZonedDateTime`, so there is no `Period` value for `period` to return
and no third/fourth constructor seat for the others to fill.

Decide first: does `TimeZone` grow `period_for_utc` / `periods_for_local` and a
`Period` type (converging toward Rails), or is the Temporal delegation ratified
with call-site cites? The former is the CLAUDE.md-preferred direction and is a
much larger job than the member count suggests.

`marshal_dump` / `marshal_load` (`time_with_zone.rb:529-535`) are the reasoned
SKIP — Ruby `Marshal` has no JS counterpart. They should go into a `SKIP_GROUPS`
entry in `scripts/parity/conventions.ts` with that reason rather than be left as
bare missing rows.

### B. `to_formatted_s` / `readable_inspect` / `default_inspect` collision (12)

`core_ext/date_time/conversions.rb` (8: `to_formatted_s`, `readable_inspect`,
`default_inspect`, `usec`, `nsec`, `offset_in_seconds`,
`seconds_since_unix_epoch`, `civil_from_format`), `core_ext/date/conversions.rb`
(3) and `core_ext/time/conversions.rb` (1) all map onto the **single** shared
`packages/activesupport/src/time-ext.ts`.

`to_formatted_s`, `readable_inspect` and `default_inspect` are three _different_
Ruby methods on three different classes that would collapse onto one TS function
name each. `time-ext.ts` is a module of free functions taking the receiver as
the first parameter, so one `toFormattedS(receiver, format)` would have to
dispatch on receiver type for all three — which is what
`core-ext/date-and-time/calculations.ts` already does for its mixin, but here
the three Ruby bodies genuinely differ.

Decide first: one dispatching function per name, or split `time-ext.ts` so each
Rails conversions file gets its own TS file at its own path. The latter matches
the Rails layout `parity:api` matches on and is probably right, but it moves a
large existing file.

The five non-colliding members (`usec`, `nsec`, `offset_in_seconds`,
`seconds_since_unix_epoch`, `civil_from_format`) can land without resolving
that, and are the cheapest part of this story.

### C. `ENV["TZ"]` — `core_ext/time/compatibility.rb` (3)

`preserve_timezone`, `system_local_time?`, `active_support_local_zone`
(`core_ext/time/compatibility.rb:13-39`).

`active_support_local_zone` memoizes `Time.new.zone` and invalidates the memo
when `ENV["TZ"]` changes (`compatibility.rb:33-36`). The RFC 0098 task prompts
forbid `process.*`, so `ENV["TZ"]` is not readable directly.
`Intl.DateTimeFormat().resolvedOptions().timeZone` is the obvious substitute and
also gives a value to key the memo on, but that is a deviation that needs a
call-site justification — confirm it is acceptable before writing it.

`preserve_timezone` here is `system_local_time? || super`, where `super` is
`DateAndTime::Compatibility#preserve_timezone` — already ported by #6465 at
`packages/activesupport/src/core-ext/date-and-time/compatibility.ts`.

### D. `acts_like_time?` — `core_ext/time/acts_like.rb` (1)

Blocked on the same cross-package question as C: Ruby reopens `::Time`, and
trails' `Time` is owned by `@blazetrails/date`.
`packages/activesupport/src/core-ext/object/acts-like.ts:38-44` finds a marker
by looking for the translated method name on the value, so until a marker exists
on the Temporal/`Date` receivers the lookup returns false for every value.

This is why PR #6465 carries a `call-mismatches-exclude` row for
`core-ext/date-and-time/zones.ts in_time_zone → acts_like?`
(`scripts/api-compare/call-mismatches-exclude/activesupport/core-ext/date-and-time/zones.json`).
**Delete that row as part of this story** once the marker lands — it exists
solely because this member is unported.

### Not in scope here

`core_ext/time/zones.rb`'s `zone` / `zone_default` are covered by
[[converge-time-zone-reader-names]].

## Acceptance criteria

- Each of A–D either lands or is `pnpm tasks block`ed with the specific blocker;
  "it would be a bigger diff" is not one.
- `marshal_dump` / `marshal_load` recorded as a reasoned SKIP in
  `scripts/parity/conventions.ts`, not left as bare missing rows.
- The `zones.json` call-mismatch row above is deleted when D lands.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean.
