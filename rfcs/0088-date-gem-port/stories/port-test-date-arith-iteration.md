---
title: "Port test_date_arith.rb next_* + step/upto/downto (11 tests)"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: ["port-test-date-arith-operators"]
deps-rfc: []
est-loc: 240
priority: null
pr: 6321
claim: "2026-08-10T02:26:38Z"
assignee: "port-test-date-arith-iteration"
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

This story ports **Lines 153-end: the `next_*` family plus the `downto` / `upto` / `step` iterators and their `__noblock` (Enumerator-returning) arms. Starts at `test_next` (`:153`).**

Ruby source: `vendor/date/test/date/test_date_arith.rb`
Target: `packages/date/src/test-date-arith.test.ts` (the convention name `parity:test` expects;
`scripts/test-compare/compare.ts:1264` maps the `date` package to
`packages/date/src/`).

Tests in scope (11):

- `test_next`
- `test_next_day`
- `test_next_month`
- `test_next_month__2`
- `test_next_year`
- `test_downto`
- `test_downto__noblock`
- `test_upto`
- `test_upto__noblock`
- `test_step`
- `test_step__noblock`
- `test_step__compare`

## Acceptance criteria

- [ ] Every listed test is ported into `packages/date/src/test-date-arith.test.ts` under its Ruby
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

- [ ] Lands **after** [[port-test-date-arith-operators]], which creates
      `packages/date/src/test-date-arith.test.ts`. Both stories write the same file, so they
      must not run in parallel (CLAUDE.md: split PRs take non-overlapping
      files).

## Notes

Sizing is a scoping estimate from the Ruby line ranges, not a measurement. If the
port exceeds the PR LOC ceiling, ship the part that fits and file the remainder
as a sibling story — do not grow the PR and do not open the sibling PR yourself.
