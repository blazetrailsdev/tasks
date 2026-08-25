---
title: "Port test_date_strftime.rb's GNU extensions, composite formats and width overflow"
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
closed-reason: "Duplicate — covered by port-test-date-strftime-gnuext."
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

Ruby: `vendor/date/test/date/test_date_strftime.rb`

TS (convention path): `packages/date/src/test-date-strftime.test.ts`

Tests in scope:

- `test_strftime__gnuext` (`:216-316`)
- `test_strftime__gnuext_LN` (`:317-334`)
- `test_strftime__gnuext_z` (`:335-342`)
- `test_strftime__gnuext_complex` (`:343-357`)
- `test__different_format` (`:358-439`)
- `test_overflow` (`:440-448`)

The coreutils GNU extensions (`%-`, `%_`, `%0`, `%^`, `%#`, `%::z`,
`%L`/`%N` widths) plus the composite-conversion table and the width-overflow
guard. RFC 0088 story `strftime-lacks-composite-conversions` is done, and
`strftime-case-flags-and-locale-extensions` covers `%^`/`%#`, so the port
should already answer most of these; `test_overflow` is the one likeliest to
surface a real gap (Ruby raises `Date::Error, "strftime: width too big"` rather
than allocating).

Implementation: `packages/date/src/date.ts:366` and the flag handling below it,
against `vendor/date/ext/date/date_strftime.c`.

## Acceptance criteria

- [ ] The six tests land under their gem names.
- [ ] `test_overflow` asserts the gem's raise, and if the port does not raise, the raise is added in this PR (it is small) rather than the assertion softened.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
