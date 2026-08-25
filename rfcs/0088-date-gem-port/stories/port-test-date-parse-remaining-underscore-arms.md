---
title: "Port test_date_parse.rb's remaining _parse tables, including the odd-offset and long-year arms"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-parse-heuristic."
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

- `test__parse_slash_exp` (`:436-476`)
- `test__parse__2` (`:477-548`)
- `test__parse_odd_offset` (`:582-590`)
- `test__parse_too_long_year` (`:591-604`)

The remaining `Date._parse` tables. `test__parse_odd_offset` is the
sub-minute-offset case RFC 0088 calls out explicitly: `date_zone_to_diff`
(`vendor/date/ext/date/date_parse.c:523-528`) answers seconds, and the port keeps
the offset as a `number` for exactly this reason
(`packages/date/src/time.ts:26-28`), so it should pass as-is.
`test__parse_too_long_year` is the digit-width bound and interacts with the open
story `parse-year-fragment-loses-exactness-past-max-safe-integer` — port the
test; if it reds, that story is the fix, not a weakened assertion.

## Acceptance criteria

- [ ] All four tests land in `test-date-parse.test.ts` under their gem names.
- [ ] `_parse_odd_offset` asserts the exact seconds offset, not a minute-truncated one.
- [ ] If `_parse_too_long_year` fails, it is left failing behind a link to `parse-year-fragment-loses-exactness-past-max-safe-integer` (or that story is shipped first), never softened.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
