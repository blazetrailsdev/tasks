---
title: "Port test_date_strftime.rb's core directive tables"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-strftime-core."
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

- `test_strftime` (`test_date_strftime.rb:70-92`)
- `test_strftime__2` (`:93-117`)
- `test_strftime__3_1` (`:118-125`)
- `test_strftime__3_2` (`:126-137`)
- `test_strftime__4` (`:138-183`)
- `test_strftime__offset` (`:184-200`)
- `test_strftime_milli` (`:201-209`)
- `test_strftime__minus` (`:210-215`)

`strftime` is one of the two surfaces RFC 0088 keeps Ruby-shaped by design (it
answers a `string`), so this whole file is a straight port with no Temporal
value-shape mismatch — the cheapest credit available in the package.

The implementation is `packages/date/src/date.ts:366` (`strftime`, exported from
`index.ts`) against `vendor/date/ext/date/date_strftime.c`. Trails-only coverage
sits at `date.trails.test.ts:650-680`. Several done stories already converged
directive arms (`strftime-missing-directive-arms`,
`strftime-honours-no-width-outside-n-and-l`, `strftime-case-flags-and-locale-extensions`,
`strftime-n-and-l-take-no-width-prefix`), so most rows should pass on arrival.
`test_strftime__offset` is the `%z` family and depends on the offset staying a
`number` (`packages/date/src/time.ts:26-28`).

## Acceptance criteria

- [ ] The eight tests land in `test-date-strftime.test.ts` under their gem names.
- [ ] Every directive row is asserted against the gem's expected string byte-for-byte.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
