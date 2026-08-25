---
title: "Port test_date_conv.rb — the to_time/to_date/to_datetime conversion matrix"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of port-test-date-conv (same 12 tests of test_date_conv.rb)."
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

Ruby: `vendor/date/test/date/test_date_conv.rb`

TS (convention path): `packages/date/src/test-date-conv.test.ts`

Tests in scope:

- `test_to_class` (`test_date_conv.rb:16-23`)
- `test_to_time__from_time` (`:24-43`)
- `test_to_time__from_date` (`:44-50`)
- `test_to_time_to_date_roundtrip__from_gregorian_date` (`:51-59`)
- `test_to_time_to_date_roundtrip__from_julian_date` (`:60-68`)
- `test_to_time__from_datetime` (`:69-99`)
- `test_to_date__from_time` (`:100-113`)
- `test_to_date__from_date` (`:114-120`)
- `test_to_date__from_datetime` (`:121-130`)
- `test_to_datetime__from_time` (`:131-161`)
- `test_to_datetime__from_date` (`:162-169`)
- `test_to_datetime__from_datetime` (`:170-188`)

The `to_time` / `to_date` / `to_datetime` conversion matrix across
`Time`/`Date`/`DateTime`. This is the file that most directly exercises RFC
0088's return-type table, and it is where the done story
`date-to-date-seat-raises-on-julian-only-spellings` is observable:
`test_to_time_to_date_roundtrip__from_julian_date` round-trips a pre-reform
Julian date, which the Temporal seat cannot hold and which the port raises
`Date::Error, "invalid date"` for (MRI's `Date#to_date` is `self` and never
raises — `vendor/date/ext/date/date_core.c:8977-8981`).

Assert the documented raise for that test and cite RFC 0088's "What the Temporal
seat cannot hold" at the assertion, so a later reader does not read it as a bug.
The `::Time` side is `packages/date/src/time.ts` (328 lines), whose offset is a
`number` for the sub-minute reason recorded at `time.ts:26-28`.

## Acceptance criteria

- [ ] The twelve tests land in `test-date-conv.test.ts` under their gem names.
- [ ] `..._from_julian_date` asserts the RFC-documented `Date::Error` with the RFC section cited inline; the Gregorian round trip asserts real values.
- [ ] Each conversion answers the Temporal type RFC 0088's return table names.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
