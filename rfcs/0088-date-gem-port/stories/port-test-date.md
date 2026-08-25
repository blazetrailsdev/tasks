---
title: "Port test_date.rb (9 tests) onto the date package"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6336
claim: "2026-08-10T13:53:22Z"
assignee: "port-test-date"
blocked-by: null
closed-reason: null
---

> **PR #6311 (merged 2026-08-10) landed only 5 of this story's 9 tests.** The
> four that remain are listed in the Progress section at the bottom, each with
> the gem surface it is still blocked on.

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

This story ports **The whole file (9 tests, 190 lines). Covers `Date::Infinity` range behaviour, the `Date::ITALY`/`ENGLAND`/`JULIAN`/`GREGORIAN` constants, `#-`, `#eql?`, `#hash`, `#freeze` and `#deconstruct_keys`.**

Ruby source: `vendor/date/test/date/test_date.rb`
Target: `packages/date/src/test-date.test.ts` (the convention name `parity:test` expects;
`scripts/test-compare/compare.ts:1264` maps the `date` package to
`packages/date/src/`).

Tests in scope (9):

- `test_range_infinite_float`
- `test__const`
- `test_sub`
- `test_eql_p`
- `test_hash`
- `test_freeze`
- `test_submillisecond_comparison`
- `test_infinity_comparison`
- `test_deconstruct_keys`

## Acceptance criteria

- [ ] Every listed test is ported into `packages/date/src/test-date.test.ts` under its Ruby
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

## Progress — PR #6311 landed 5 of the 9 (2026-08-10)

Ported and credited by `parity:test` (`test_date.rb` 0/9 → 5/9):
`test__const`, `test_eql_p`, `test_freeze`, `test_submillisecond_comparison`,
`test_deconstruct_keys`. That PR also implemented what they needed —
`Date::MONTHNAMES` / `ABBR_MONTHNAMES` / `DAYNAMES` / `ABBR_DAYNAMES`
(`date_core.c:9420-9443`, `:9598-9614`) and `Date#deconstruct_keys` /
`DateTime#deconstruct_keys` with its `TypeError` guard
(`date_core.c:7416-7464`, `:7500-7504`) — and rode on the `cmp_gen` / `cmp_dd` /
`equal_gen` / `Date::Infinity` cluster a sibling story landed on main first.

**This story stays open for the remaining four**, each blocked on gem surface
that is still absent:

| test                        | Ruby               | missing surface                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_range_infinite_float` | `test_date.rb:9`   | `Date.today`, `#+`, `#-`, and `Range#cover?` over a `Float::INFINITY` endpoint                                                                                                                                                                                  |
| `test_sub`                  | `test_date.rb:47`  | subclass propagation through `#+`/`#-`/`#>>`/`#<<`/`#succ`, plus `Marshal.dump`/`load` (`d_lite_marshal_dump`)                                                                                                                                                  |
| `test_hash`                 | `test_date.rb:127` | `d_lite_hash`, and a decision on how the `eql?`/`hash` pair is expressed at all — JS `Map` is identity-keyed                                                                                                                                                    |
| `test_infinity_comparison`  | `test_date.rb:166` | the four `Float::INFINITY <=> Date::Infinity.new` assertions need MRI's `flo_cmp` `infinite?` duck-typing protocol (`numeric.c`), which is not vendored; the four `Date::Infinity` receiver assertions already work against the landed `DateInfinity#compareTo` |

`#+` / `#succ` belong to `port-test-date-arith-operators` — sequence after it.
