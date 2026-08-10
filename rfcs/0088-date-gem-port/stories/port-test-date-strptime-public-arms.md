---
title: "Port test_date_strptime.rb's public Date.strptime/DateTime.strptime arms"
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
closed-reason: "Duplicate — covered by port-test-date-strptime-public."
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

Ruby: `vendor/date/test/date/test_date_strptime.rb`

TS (convention path): `packages/date/src/test-date-strptime.test.ts`

Tests in scope:

- `test_strptime` (`:306-325`)
- `test_strptime__2` (`:326-376`)
- `test_strptime__minus` (`:377-392`)
- `test_strptime__comp` (`:393-462`)
- `test_strptime__d_to_s` (`:463-470`)
- `test_strptime__ex` (`:471-497`)
- `test_given_string` (`:498-505`)
- `test_sz` (`:506-523`)

The public `Date.strptime` / `DateTime.strptime` surface over `_strptime`,
routed through `dNewByFrags` / `dtNewByFrags`
(`vendor/date/ext/date/date_core.c:4315`, `:8311`; both exported from
`packages/date/src/index.ts`). These answer dates, so this is where the Temporal
default shows — expected and benign per the RFC.

`test_sz` is the zone/offset table and leans on the `number`-seconds offset
(`packages/date/src/time.ts:26-28`); `test_strptime__comp` is the two-digit-year
completion arm (`_cent`, trails-only at `date.trails.test.ts:444`);
`test_strptime__ex` is the raise table.

## Acceptance criteria

- [ ] The eight tests land under their gem names.
- [ ] `strptime__ex` asserts `Date::Error`.
- [ ] `test_sz` asserts the exact seconds offset, including any sub-minute value, per RFC 0088.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
