---
title: "assertions-date-parse-unported-parsers"
status: ready
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `assertions-date-cluster` (RFC 0105), which took the `date` package
from 53 assertion divergences to 4. The 4 that remain are both in
`vendor/date/test/date/test_date_parse.rb` and both blocked on parser families
the port has not written:

- `length limit` — rails 22 raises vs trails 13. Ruby asserts the same
  `ArgumentError` for `_parse`, `_iso8601`, `_rfc3339`, `_xmlschema`,
  `_rfc2822`, `_rfc822` and `_jisx0301`, and again for each non-underscore
  builder on `Date` and on `DateTime` (`test_date_parse.rb`, `test_length_limit`).
  `Date._iso8601` / `_rfc3339` / `_xmlschema` / `_jisx0301` and their builders
  are unported, so 9 of the 22 arms have nothing to call. The trails test also
  asserts `_httpdate` / `httpdate` arms Ruby does not — those are TS-only extras
  and belong in `date.trails.test.ts`.
- The `test__parse` pair (reported as a leading-space `parse`) — rails 3 vs trails 6. `test__parse`'s table (a ~200-row
  `Date._parse` fixture list, 3 assertions in its loop body) is unported, so the
  report matches Ruby's `test__parse` against the trails `it("parse")` that ports
  `test_parse`. Porting `test__parse` as `it(" parse")` resolves both sides.

Rails/gem source: `vendor/date/ext/date/date_core.c` (`date_s__iso8601` and
friends), `vendor/date/test/date/test_date_parse.rb`.

## Acceptance criteria

- `test_date_parse.rb` reports 0 assertion-count and 0 assertion-kind mismatches
  in `pnpm parity:test -- --assertions --package date`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; `pnpm parity:test` percent for date does not drop.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
