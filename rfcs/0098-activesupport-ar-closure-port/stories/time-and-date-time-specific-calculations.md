---
title: "time-and-date-time-specific-calculations"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6456
claim: "2026-08-13T03:36:51Z"
assignee: "call-args-ar-predicate-builder-set-handler"
blocked-by: null
closed-reason: null
---

## Context

Slot C: the receiver-specific calculation remainders once the DateAndTime mixin exists.

- `core_ext/time/calculations.rb` — 29 missing: `Time#in`, `midnight`/`at_midnight`/`at_beginning_of_day`, `midday`/`noon`/`at_midday`/`at_noon`/`at_middle_of_day`, `at_end_of_day`, `at_beginning_of_hour`/`at_end_of_hour`/minute variants, `seconds_since_midnight`, `seconds_until_end_of_day`, `sec_fraction`, plus class members (`current`, `zone` interplay — check what's already ported; file exists with 22 matched).
- `core_ext/date_time/calculations.rb` — 24 missing: `subsec` and the same `at_*` family on DateTime.

Rails: `vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb`, `core_ext/date_time/calculations.rb`. Audit slot ~250 LOC.

## Acceptance criteria

- Both files report 0 missing in `pnpm parity:api` (or SKIP_GROUPS rows with reasons for genuinely non-portable members, e.g. Ruby `Time` allocator internals).
- Tests mirror the corresponding cases in `vendor/rails/activesupport/test/core_ext/time_ext_test.rb` / `date_time_ext_test.rb` for the added members.
