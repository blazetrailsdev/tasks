---
title: "Port test_date_parse.rb's _iso8601/_rfc3339/_xmlschema fragment parsers"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 360
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-parse-formats."
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

Ruby: `vendor/date/test/date/test_date_parse.rb`

TS (convention path): `packages/date/src/test-date-parse.test.ts`

Tests in scope:

- `test__iso8601` (`:714-872`)
- `test__rfc3339` (`:873-892`)
- `test__xmlschema` (`:893-979`)

The three wire-format fragment parsers. `Date._iso8601` is the big one (158
lines) and covers the ISO ordinal, week-date and time-only spellings; the port's
ISO arm is around `packages/date/src/date.ts:1337` with the `parse_iso2` spellings
covered trails-only at `date.trails.test.ts:200`.

These return fragment objects, not dates, so like `test__parse` they are a
straight Ruby-shaped port with no Temporal mismatch.

## Acceptance criteria

- [ ] The three tests land under their gem names in `test-date-parse.test.ts`.
- [ ] The week-date and ordinal ISO spellings answer the same fragment keys MRI answers (`:cwyear`/`:cweek`/`:cwday`, `:yday`), not a civil triple.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
