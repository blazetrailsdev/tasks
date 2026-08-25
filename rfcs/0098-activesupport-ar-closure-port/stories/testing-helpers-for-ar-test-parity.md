---
title: "testing-helpers-for-ar-test-parity"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6454
claim: "2026-08-13T02:56:51Z"
assignee: "converge-number-converter-format-options"
blocked-by: null
closed-reason: null
---

## Context

Slot H: activesupport testing helpers that block AR/AM **test** parity (separate axis from API parity; ~30 members, audit slot ~260 LOC).

- `testing/method_call_assertions.rb` — 3 remaining of 7 (`assert_called`, `assert_called_with` family): **used by 30 AR test files** (grep vendor/rails/activerecord/test).
- `testing/time_helpers.rb` — NO TS FILE, 15 members (`travel`, `travel_to`, `travel_back`, `freeze_time`, `unfreeze_time`, stubs plumbing): used by 6 AR test files.
- `testing/assertions.rb` — NO TS FILE, 10 members (`assert_difference`, `assert_no_difference`, `assert_changes`, `assert_no_changes`, `assert_nothing_raised`) — pervasive in AR tests.
- `testing/stream.rb` — NO TS FILE, 3 (`silence_stream`, `capture`, `quietly`).

Rails: `vendor/rails/activesupport/lib/active_support/testing/`. Wire into the vitest harness the way `cases/helper.ts` (the helper.rb port) consumes shared test infra — AR suite-wide settings live there, not in test-setup files. Members that are minitest-runner plumbing rather than assertions go to SKIP_GROUPS (coordinate with 0072/activesupport-closure-skip-groups-triage, which owns test_case.rb triage).

## Acceptance criteria

- The four files report 0 missing or reasoned SKIP rows.
- `travel_to`/`freeze_time` interact correctly with vitest fake timers (document the mechanism at the call site if it deviates).
- At least one currently-skipped AR test that needed `assert_called` or `travel_to` is enrolled and passing, proving the helpers work end-to-end.
