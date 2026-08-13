---
title: "time-with-zone-and-duration-residue"
status: ready
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

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
