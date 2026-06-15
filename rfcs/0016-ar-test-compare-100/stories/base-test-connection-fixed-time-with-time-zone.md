---
title: "base-test-connection-fixed-time-with-time-zone"
status: draft
updated: 2026-06-15
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from [[base-test-connection-default-timezone]] (PR #3320).

Rails' `test_connection_in_local_time` / `test_connection_in_utc_time`
(base_test.rb:1197-1199, 1217-1219) each include a PostgreSQL-only branch that
asserts on `fixed_time_with_time_zone` (a `timestamptz`, time-zone-aware
column default):

```ruby
if current_adapter?(:PostgreSQLAdapter)
  assert_equal Time.utc(2004, 1, 1, 0, 0, 0, 0), default.fixed_time_with_time_zone
end
```

The ported tests omit this attribute and assertion entirely — `Default` only
declares `fixed_date` / `fixed_time`. Closing the gap requires
time-zone-aware-attribute default deserialization (timestamptz default string
→ TimeWithZone) so the assertion can be added under the PG adapter only.

## Acceptance criteria

- [ ] `time_zone_aware_attributes` default-string deserialization wired for
      `timestamptz`-backed defaults.
- [ ] Add `fixed_time_with_time_zone` to the two `connection in {local,utc}
    time` tests under a PostgreSQL-adapter guard, matching Rails.
- [ ] Remove the "omitted until time_zone_aware_attributes defaults are wired"
      comments from `base.test.ts`.
