---
title: "port-test-date-strptime-3"
status: closed
updated: 2026-08-10
rfc: "0088-date-gem-port"
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
closed-reason: "Superseded: test__strptime__3 ships in PR #6320 after all. It was deferred only for the 700-LOC ceiling; review of #6320 held that the stamped story port-test-date-strptime-frags lists all five tests and a partial port does not meet its 'Every listed test is ported' criterion, so the test was restored and the PR runs ~40 LOC over the ceiling with that noted in its body."
---

## Context

`port-test-date-strptime-frags` (PR #6320) ported four of the five tests in
`vendor/date/test/date/test_date_strptime.rb` lines 70-305 — `test__strptime`,
`test__strptime__2`, `test__strptime__width` and `test__strptime__fail` — into
`packages/date/src/test-date-strptime.test.ts`. The fifth,
`test__strptime__3` (`test_date_strptime.rb:120-215`), was left out purely on
size: its table is ~145 lines on its own and the PR was already at the 700-LOC
ceiling with the other four plus the `to_datetime` seat convergence.

It is the broadest of the five: one `Date._strptime(*x)` per row, read back
through `values_at(:year,:mon,:mday,:hour,:min,:sec,:zone,:offset,:wday)`, over

- iso8601, including `23:59:60`, a negative year and `+012345` / `-012345`
- `ctime(3)` / `asctime(3)` via `%c`
- `date(1)`'s `%Z` spellings: `EST`, `MET DST`, `AMT` (unknown → `offset` nil),
  `GMT+09`, `GMT+0908`, `GMT+090807`, `GMT-09:08:07`, `GMT-3.5`, `GMT-3,5`,
  `Mountain Daylight Time`, `E. Australia Standard Time`
- rfc822, `%p` / `%r` meridian arms, and two out-of-range zone offsets

so it is the row set that exercises `date_zone_to_diff` (`date_parse.c:523-528`)
hardest through the strptime path.

The harness it needs is already in the target file: the `valuesAt` helper
(Ruby's `Hash#values_at`, `nil` for an absent key) and the
`[[string, string], unknown[]][]` table shape `test__strptime__width` uses,
including the `if (y[1] === -1)` yday arm.

## Acceptance criteria

- [ ] `test__strptime__3` is ported into
      `packages/date/src/test-date-strptime.test.ts` under its Ruby name
      (`it(" strptime  3")` — do NOT rename or reword it, `parity:test`
      matches on names).
- [ ] `pnpm parity:test --package date` credits it; the date test total moves
      up by one and no other package regresses.
- [ ] Real failures are fixed in `packages/date/src`, not by adjusting the
      test. Assertion-VALUE mismatches are expected and benign per
      `vendor/sources.ts:212-221` — do not converge a Temporal return back to a
      Ruby-shaped one to silence one.
- [ ] A genuine C-source divergence too large for the PR is filed against RFC
      0088 as a `draft` story with the `date_strptime.c` / `date_parse.c`
      `file:line` in hand.
