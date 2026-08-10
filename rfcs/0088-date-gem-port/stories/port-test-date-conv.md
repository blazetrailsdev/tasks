---
title: "Port test_date_conv.rb to_time/to_date/to_datetime matrix (12 tests)"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: 6314
claim: "2026-08-10T00:56:48Z"
assignee: "converge-date-infinity-nan-and-coerce-arms-to-lib-date-rb"
blocked-by: null
closed-reason: null
---

## Context

RFC 0088's own measure of done is the gem's test suite. `vendor/sources.ts:210`
states it plainly: `test/date/` "is the gate for this cluster — 12 files, 145
`def test_` methods — and it is the only fidelity measure the date port has."
`compareApi: false` (`vendor/sources.ts:208`), because the gem is implemented in
C and the Ruby extractor finds only 12 public methods in `lib/date.rb`, so
`parity:api` cannot produce a denominator for this package at all.

As of 2026-08-09 that gate reads **0/138 tests (0%), 0/10 files** — after 56
merged stories and ~4,900 LOC in `packages/date/src`. The only test files in the
package are `date.trails.test.ts` and `time.trails.test.ts`, both trails-only.
Not one of Ruby's comparable test files has been started.

This story ports **The whole file (12 tests, ~180 lines): the full `#to_time` / `#to_date` / `#to_datetime` conversion matrix across all three source classes, plus both Julian and Gregorian round-trips.**

Ruby source: `vendor/date/test/date/test_date_conv.rb`
Target: `packages/date/src/test-date-conv.test.ts` (the convention name `parity:test` expects;
`scripts/test-compare/compare.ts:1264` maps the `date` package to
`packages/date/src/`).

Tests in scope (12):

- `test_to_class`
- `test_to_time__from_time`
- `test_to_time__from_date`
- `test_to_time_to_date_roundtrip__from_gregorian_date`
- `test_to_time_to_date_roundtrip__from_julian_date`
- `test_to_time__from_datetime`
- `test_to_date__from_time`
- `test_to_date__from_date`
- `test_to_date__from_datetime`
- `test_to_datetime__from_time`
- `test_to_datetime__from_date`
- `test_to_datetime__from_datetime`

## Acceptance criteria

- [ ] Every listed test is ported into `packages/date/src/test-date-conv.test.ts` under its Ruby
      name, translated by `docs/ruby-ts-conventions.md`. **Do not rename or
      reword a test name** — `parity:test` matches on them.
- [ ] `pnpm parity:test --package date` credits these tests; the date package's
      file and test totals both move up and no other package regresses.
- [ ] Assertion-_value_ mismatches against these tests are **expected and
      benign** — RFC 0088 returns `Temporal` by default where Ruby returns
      `Date`/`DateTime`/`Time` (`vendor/sources.ts:212-221`). Do **not** converge
      a Temporal return back to a Ruby-shaped one to silence one; that reverses
      the RFC's headline decision.
- [ ] Real failures are fixed in `packages/date/src`, not by adjusting the test.
      Where a failure is a genuine C-source divergence too large for this PR,
      file it against 0088 as a `draft` story with the `date_core.c` /
      `date_parse.c` / `date_strftime.c` `file:line` in hand — per the sweep
      decision of 2026-08-09, C-read findings are captured but not scheduled
      while the test lane runs.

## Notes

Sizing is a scoping estimate from the Ruby line ranges, not a measurement. If the
port exceeds the PR LOC ceiling, ship the part that fits and file the remainder
as a sibling story — do not grow the PR and do not open the sibling PR yourself.
