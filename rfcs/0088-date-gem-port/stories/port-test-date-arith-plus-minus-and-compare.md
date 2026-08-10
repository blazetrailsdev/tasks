---
title: "Port test_date_arith.rb's +, -, <=> and new_offset"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 230
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-arith-operators."
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

Ruby: `vendor/date/test/date/test_date_arith.rb`

TS (convention path): `packages/date/src/test-date-arith.test.ts`

Tests in scope:

- `test_new_offset` (`test_date_arith.rb:10-19`)
- `test__plus` (`:20-32`)
- `test__plus__ex` (`:33-55`)
- `test__minus` (`:56-73`)
- `test__minus__ex` (`:74-89`)
- `test__compare` (`:90-99`)

`Date#+` / `#-` / `#<=>` and `DateTime#new_offset`. RFC 0088 drops the
`Rational` exactness guarantee for fractional-day arithmetic ("Drop" row in the
gap table) and the done story `rational-is-number-backed-not-arbitrary-precision`
records that `Rational` in `packages/date/src/date.ts:989-1005` is
number-backed. So rows adding a `Rational` day fraction may answer a value that
differs in the last bits from MRI.

Port the rows; where one fails **only** on sub-nanosecond exactness, that is the
RFC's stated drop — record it in the PR body and, if it cannot be asserted
honestly, file it rather than rounding the assertion to fit.
`test__plus__ex` / `test__minus__ex` are the `TypeError` tables.

## Acceptance criteria

- [ ] The six tests land in `test-date-arith.test.ts` under their gem names.
- [ ] Arithmetic returns the Temporal type per RFC 0088's return table (`Date#+` → `Temporal.PlainDate`).
- [ ] Any row failing solely on dropped `Rational` exactness is named in the PR body with the RFC gap-table row that drops it.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
