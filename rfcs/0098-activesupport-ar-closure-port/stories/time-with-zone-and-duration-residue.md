---
title: "time-with-zone-and-duration-residue"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6465
claim: "2026-08-13T15:20:29Z"
assignee: "stats-sync-20260813"
blocked-by: null
closed-reason: null
---

## Status — partially delivered in #6465

27 of the 48 members `pnpm parity:api --package activesupport` reported missing
landed in PR #6465, together with 3 new files
(`core-ext/date-and-time/compatibility.ts`, `core-ext/date-and-time/zones.ts`,
and the `duration.rb` / `time_with_zone.rb` residue). activesupport went
1294 -> 1317 matched, AR closure 687 -> 714.

This story stays **in-progress and stamped to #6465 without a `Closes-story`
trailer**: the trailer would mark it done on merge, and its own acceptance
criteria are not met. The estimate (~45 members / ~250 LOC) understated the real
shape — 48 members over 11 files, 3 of which did not exist.

The 21 remaining members each have a structural blocker rather than being
volume, and are carried by two follow-ups with the Rails `file:line` analysis
already done:

- [[time-with-zone-residue-structural-blockers]] — the TZInfo `Period` cluster,
  the `to_formatted_s` / `readable_inspect` / `default_inspect` three-way
  collision in the shared `time-ext.ts`, `ENV["TZ"]` in
  `core_ext/time/compatibility.rb`, and the acts_like markers (section D records
  the measurement showing why the #6465 attempt was inert).
- [[converge-time-zone-reader-names]] — `zone` / `zone_default`, a mechanical
  rename across 63 call sites in 4 packages.

Close this story once those two are scheduled, or mark it done if the maintainer
judges the delivered slice sufficient.

## Context

Slot F: time-zone / duration residue (~45 members, audit slot ~250 LOC).

- `time_with_zone.rb` — 15 remaining of 62: `comparable_time`, `period`, `gmtoff`, `rfc822`, `to_datetime`, `present?`, `marshal_dump`/`marshal_load` (likely SKIP: Ruby Marshal), private `incorporate_utc_offset`, `get_period_and_ensure_valid_local_time`, `transfer_time_values_to_utc_constructor`, `duration_of_variable_length?`.
- `core_ext/date_time/conversions.rb` — 8 of 10; `core_ext/date/conversions.rb` 3; `core_ext/time/conversions.rb` 2.
- `core_ext/date_and_time/compatibility.rb` — NO TS FILE, 4 (`preserve_timezone`, `utc_to_local_returns_utc_offset_times`); required by active_support.rb itself.
- `core_ext/date_and_time/zones.rb` — NO TS FILE, 2 (`in_time_zone` — 2 AR lib call sites); `core_ext/time/zones.rb` 2 remaining; `core_ext/time/compatibility.rb` 3; `core_ext/time/acts_like.rb` 1; `core_ext/date_time/acts_like.rb` — NO TS FILE, 4.
- `duration.rb` — 5 remaining of 35.

Rails sources under `vendor/rails/activesupport/lib/active_support/`. AR needs the `in_time_zone`/`change` path for the datetime type and TimeWithZone serialization.

## Acceptance criteria

- Listed files at 0 missing or reasoned SKIP rows (Marshal pair); delta non-negative.
- `in_time_zone` string/zone-object arms both ported (Symbol-vs-String rule per CLAUDE.md).
