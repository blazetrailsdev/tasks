---
title: "chronic: run the daylight-savings tests under a DST-observing local zone"
status: done
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9303
claim: "2026-10-25T13:12:20Z"
assignee: "chronic-daylight-savings-tests-run-under-a-dst-zone"
blocked-by: null
closed-reason: null
---

## Context

`packages/chronic/src/daylight-savings.test.ts` ports `vendor/chronic/v0.10.2/test/test_daylight_savings.rb` (trails#9286). The tests cross the 2008 US DST boundaries (`Time.local(2008, 3, 9, ...)`, `Time.local(2008, 11, 2, ...)`), and only exercise `RepeaterTime#next`'s `offset_fix = midnight.gmt_offset - tomorrow_midnight.gmt_offset` (`vendor/chronic/v0.10.2/lib/chronic/repeaters/repeater_time.rb:84-85`) when the process local zone observes DST. CI runs in UTC, so `offset_fix` is always 0 and the four tests pass whatever the arithmetic does. Upstream chronic has the same gap.

## Acceptance criteria

- [ ] The daylight-savings tests run with a DST-observing local zone (for example `America/New_York`). Set it through `@blazetrails/date`'s local-zone seam (`resetLocalTimeZoneId`) or the vitest project env, not through a `process.*` read in package code.
- [ ] A deliberately broken `offset_fix` (for example forced to 0) makes at least one of them fail, verified once locally.
- [ ] Test names stay verbatim; `parity:test` for chronic stays 163/163.
