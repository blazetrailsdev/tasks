---
title: "date_time_test: exercise local-time and in_time_zone arms"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7889 converged date_time_test.rb with deviations. Rails test_saves_both_date_and_time (vendor/rails/activerecord/test/cases/date_time_test.rb:27-42) runs under `with_env_tz "America/New_York"` with `Time.local(1807, 2, 10, 15, 30, 45)`; test_assign_in_local_timezone (:63-69) uses `DateTime.civil(2017,3,1,12,0,0)` under `default: :local`. packages/activerecord/src/date-time.test.ts uses `RubyTime.utc(...)` for both because `vi.stubEnv("TZ")` does not reach Temporal, so the local-time arms are not exercised. Also test_assign_bad_date_time_with_timezone (:52-58) is Rails' `in_time_zone "Pacific Time (US & Canada)"` block and the trails test has no time-zone wrapper.

## Acceptance criteria

- A `with_env_tz` analogue that changes the process time zone for Temporal, used by "saves both date and time"; "assign in local timezone" asserts with a local-zone value.
- "assign bad date time with timezone" runs inside the equivalent of `in_time_zone`.
