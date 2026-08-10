---
title: "Port test_switch_hitter.rb's constructors across the calendar reform"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-switch-hitter-construction."
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

Ruby: `vendor/date/test/date/test_switch_hitter.rb`

TS (convention path): `packages/date/src/test-switch-hitter.test.ts`

Tests in scope:

- `test_new` (`test_switch_hitter.rb:7-68`)
- `test_jd` (`:69-99`)
- `test_ordinal` (`:100-140`)
- `test_commercial` (`:141-183`)
- `test_fractional` (`:184-252`)
- `test_canon24oc` (`:253-267`)

`test_switch_hitter.rb` is the gem's calendar-reform suite — every constructor
driven across `Date::ITALY` / `JULIAN` / `GREGORIAN` / `ENGLAND`. RFC 0088
**drops** `start`/reform as a default (`packages/date/src/date.ts:2952-2959`
keeps `JULIAN`/`GREGORIAN` as `±Infinity` sentinels, and
`date.ts:4624` documents the `.start` reader), and states that a pre-reform
`::Date` with a Julian-only spelling **raises** `Date::Error, "invalid date"`
rather than converting (story `date-to-date-seat-raises-on-julian-only-spellings`,
done).

So this slice is where the RFC's dropped-semantics table meets the gem's own
tests, and it is the slice most likely to surface a genuine decision. Where a row
constructs a Julian-only date (1582-10-05..14, 1500-02-29, …), assert the
documented raise — that is the RFC's stated behavior, not a weakening. Where a row
merely passes a non-default `start` and the resulting date is representable, it
must pass.

`test_canon24oc` is the 24:00 rollover, already covered trails-only and named in
the acceptance criteria of `datetime-proleptic-arm-computes-its-jd-eagerly`
(in-progress, PR #6299) — coordinate, do not both touch it.

## Acceptance criteria

- [ ] The six tests land in `test-switch-hitter.test.ts` under their gem names.
- [ ] Julian-only spellings assert `Date::Error` per RFC 0088's "What the Temporal seat cannot hold", with the RFC section cited in a comment at the first such assertion.
- [ ] Rows the seat CAN hold pass with real values — the raise is not used as a blanket escape.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
