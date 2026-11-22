---
title: "time-travel-to-with-time-zone-flakes-on-second-boundary"
status: draft
updated: 2026-11-22
rfc: "0061-ci-failures"
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

`packages/activesupport/test/time-travel.test.ts` "time helper travel to with time zone" flakes on a second boundary:
`expected '2026-11-22 17:23:49' to deeply equal '2026-11-22 17:23:48'` (trails#10581, Unit Tests (1), run 45049365490).

Rails' test (`vendor/rails/v8.0.5.2/activesupport/test/time_travel_test.rb`) stubs `Time.now` with a fixed value, then
computes `expected_time = 5.minutes.ago` and `travel_to 5.minutes.ago`. Both `ago` calls reach `Time.current` ->
`Time.zone.now` -> `Time.now`, so the stub pins them to the same instant. The trails test mocks `Time.now` with
`vi.spyOn(Time, "now")`, but the two `Duration.minutes(5).ago()` calls still read different clock values when they
straddle a second. So some step between `Duration#ago` / `TimeZone#now` and `Time.now` does not go through `Time.now`
as Rails does.

## Acceptance criteria

- [ ] Find the read in `Duration#ago` -> `Time.current` -> `TimeZone#now` that skips `Time.now`, and converge it onto
      Rails' chain, so stubbing `Time.now` pins both `ago` calls.
- [ ] The test passes deterministically, for example with the real clock forced across a second boundary between the two calls.
