---
title: "Port test_date_parse.rb iso8601/rfc3339/xmlschema/rfc2822/httpdate/jisx0301 (14 tests)"
status: done
updated: 2026-08-11
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: ["port-test-date-parse-heuristic"]
deps-rfc: []
est-loc: 400
priority: null
pr: 6333
claim: "2026-08-10T13:05:58Z"
assignee: "date-new-must-discard-date-initialize-add-frac"
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

This story ports **Lines 714-end: the format-specific parsers — each of `iso8601` / `rfc3339` / `xmlschema` / `rfc2822` / `httpdate` / `jisx0301` in both its `_`-prefixed frags form and its public form — plus the shared `given_string` and `length_limit` guards. Starts at `test__iso8601` (`:714`).**

Ruby source: `vendor/date/test/date/test_date_parse.rb`
Target: `packages/date/src/test-date-parse.test.ts` (the convention name `parity:test` expects;
`scripts/test-compare/compare.ts:1264` maps the `date` package to
`packages/date/src/`).

Tests in scope (14):

- `test__iso8601`
- `test__rfc3339`
- `test__xmlschema`
- `test__rfc2822`
- `test__httpdate`
- `test__jisx0301`
- `test_iso8601`
- `test_rfc3339`
- `test_xmlschema`
- `test_rfc2822`
- `test_httpdate`
- `test_jisx0301`
- `test_given_string`
- `test_length_limit`

## Acceptance criteria

- [ ] Every listed test is ported into `packages/date/src/test-date-parse.test.ts` under its Ruby
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

- [ ] Lands **after** [[port-test-date-parse-heuristic]], which creates
      `packages/date/src/test-date-parse.test.ts`. Both stories write the same file, so they
      must not run in parallel (CLAUDE.md: split PRs take non-overlapping
      files).

## Notes

Sizing is a scoping estimate from the Ruby line ranges, not a measurement. If the
port exceeds the PR LOC ceiling, ship the part that fits and file the remainder
as a sibling story — do not grow the PR and do not open the sibling PR yourself.

## Progress (2026-08-10, PR #6333)

PR #6333 shipped 4 of the 14 tests — `test__rfc2822`, `test__httpdate`,
`test_rfc2822`, `test_httpdate` — together with the parsers they needed, which
turned out not to exist: `date__rfc2822` / `date__rfc822`
(`date_parse.c:2797-2855`) and `date__httpdate` (`:2861-3010`), plus the
`Date`/`DateTime` statics at `date_core.c:4825-4945` and `:8584-8646`.

The other 10 tests and the four parsers behind them (`date__iso8601`,
`date__rfc3339`, `date__xmlschema`, `date__jisx0301`) and `check_limit`'s
`limit:` kwarg are scoped in [[port-test-date-parse-formats-iso8601-family]].
This story closes when that one lands.
