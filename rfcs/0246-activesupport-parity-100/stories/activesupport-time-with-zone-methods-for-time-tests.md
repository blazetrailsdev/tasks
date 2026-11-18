---
title: "activesupport: port TimeWithZoneMethodsForTimeAndDateTimeTest residue"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
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

`vendor/rails/rails/activesupport/test/core_ext/time_with_zone_test.rb` has 13 Miss. Most of them are in
`TimeWithZoneMethodsForTimeAndDateTimeTest` (`:1160`): beginning/end of
day, hour, minute, month and year, `seconds_since_midnight`, `localtime`
(`:1221`), `acts_like_date`, and `minus_with_datetime` / `to_datetime`.
The file also has one misplaced `hash` test in `time-with-zone.test.ts`.

## Acceptance criteria

- [ ] Port the 13 tests into
      `packages/activesupport/test/core-ext/time-with-zone.test.ts` under a
      describe for the second Ruby class.
- [ ] Move the misplaced `hash` test into that file.
- [ ] Failures are fixed in `packages/activesupport/lib`.
- [ ] The file reaches 0 Miss and 0 Move.
