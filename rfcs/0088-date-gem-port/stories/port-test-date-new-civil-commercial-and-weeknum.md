---
title: "Port test_date_new.rb's civil/commercial/weeknum/nth_kday constructors and today/now"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-new-jd-ordinal-civil + port-test-date-new-commercial-and-clock."
---

## Context

`date` is enrolled in `parity:test` (`vendor/sources.ts:183-220`,
`compareTests: true`) and stands at **0/138 tests (0%) | 0/10 files** — RFC
0088's stated burndown baseline, unmoved since enrollment. The two TS test files
that exist (`packages/date/src/date.trails.test.ts`, 1,772 lines;
`time.trails.test.ts`, 170) are `.trails.test.ts`, i.e. TS-only extras outside
the compared population, so none of their substantial coverage credits. No
gem-named test file exists in `packages/date/src/` yet.

The implementation under test is `packages/date/src/date.ts` (5,468 lines) and
`packages/date/src/time.ts` (328), exported from `packages/date/src/index.ts`.
The C read-anchor is `vendor/date/ext/date/date_core.c` and `date_parse.c`.

Per RFC 0088 the gem's test suite **is** the fidelity measure, and
assertion-value mismatches against it are **expected and benign**: the port
answers `Temporal` types where Ruby answers `Date`/`DateTime`/`Time`.
`parity:test` matches on test _names_, so a test still counts. Do **not**
reshape a Temporal return to silence a value mismatch — that reverses the RFC's
headline decision.

### This slice

Ruby: `vendor/date/test/date/test_date_new.rb`

TS (convention path): `packages/date/src/test-date-new.test.ts`

Tests in scope:

- `test_civil` (`:129-173`)
- `test_civil__neg` (`:174-182`)
- `test_civil__ex` (`:183-194`)
- `test_civil__reform` (`:195-214`)
- `test_commercial` (`:215-240`)
- `test_commercial__neg` (`:241-249`)
- `test_commercial__ex` (`:250-258`)
- `test_weeknum` (`:259-280`)
- `test_nth_kday` (`:281-302`)
- `test_today` (`:303-313`)
- `test_now` (`:314-323`)

The `Date.civil` / `.commercial` / `.weeknum` / `.nth_kday` constructors plus
`today`/`now`. `test_civil__reform` is the calendar-reform arm RFC 0088 drops
from the default (`packages/date/src/date.ts:2952-2959`,
`:4624`) — assert the documented `Date::Error` for Julian-only spellings, per
the RFC's "What the Temporal seat cannot hold", and real values everywhere else.

`weeknum` and `nth_kday` are the gem's `:nodoc:` constructors; the JDN helper
layer behind them landed in `port-the-jdn-helper-layer-behind-wnumx-and-cwyear`
(done). `test_memsize` (`:324-332`) is Ruby `ObjectSpace.memsize_of` and has no
JS analogue — it is **out of scope for this story**; file a `UNPORTED_FILES`
per-test entry for it as part of the follow-up story
`exclude-test-memsize-from-the-date-test-population` rather than porting or
deleting it here.

## Acceptance criteria

- [ ] The eleven listed tests land under their gem names; `test_memsize` is not written.
- [ ] `test_civil__reform` cites RFC 0088's dropped-`start` row at its first raise assertion.
- [ ] `test_today`/`test_now` do not become clock-flaky — freeze or bound the clock the way the Ruby does.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
