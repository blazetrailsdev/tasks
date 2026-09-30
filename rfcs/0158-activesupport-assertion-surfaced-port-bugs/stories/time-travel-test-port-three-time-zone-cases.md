---
title: "Port the three skipped TimeTravelTest time-zone cases (time_travel_test.rb:100-164)"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three `TimeTravelTest` cases are still `it.skip` in
`packages/activesupport/src/time-travel.test.ts` with no recorded reason:

- `test_time_helper_travel_to_with_time_zone` (`vendor/rails/v8.0.2/activesupport/test/time_travel_test.rb:100-112`)
- `test_time_helper_travel_to_with_different_system_and_application_time_zones` (`:114-150`)
- `test_time_helper_travel_to_with_string_for_time_zone` (`:152-164`)

A trial port of the first and third on main after #8301 passed as-is:
`Duration.minutes(5).ago()`, `travelTo("2004-11-24 01:04:44")` and
`zone()!.now()` under `withEnvTz("US/Eastern")` + `withTzDefault(TimeZone.find("UTC"))`,
wrapped in `vi.spyOn(Time, "now").mockReturnValue(Time.now())` as #8301 ports
Rails' `Time.stub(:now, Time.now)`. So they are unported coverage, not a known
bug. The second case asserts that every stubbed clock (`Time.now`, `DateTime.now`,
`Date.today`, `Time.new`) answers in the **system** zone (-05) while the
application zone is Ekaterinburg (+05). It also asserts that `Time.new` with
arguments falls through to the original implementation
(`time_helpers.rb:179-191`). It has not been tried and may surface a real
zone-handling bug in `testing/time-helpers.ts`.

## Acceptance criteria

- All three cases are unskipped with Rails' bodies and every Rails assertion,
  following the `Time.stub(:now, Time.now)` placement #8301 established (no
  stub in `:114-150`, where Rails has none).
- If `:114-150` fails, fix the implementation in `testing/time-helpers.ts`, not
  the test.
- Test names unchanged. `parity:test` and `parity:test:assertions` do not regress.
