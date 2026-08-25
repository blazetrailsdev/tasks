---
title: "Port test_date_parse.rb's test__parse — the gem's full Date._parse sub-parser table"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 450
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

- `test__parse` (`test_date_parse.rb:8-435`)

`test__parse` is a single 428-line `def` — the gem's exhaustive table for
`Date._parse`, one row per sub-parser in `vendor/date/ext/date/date_parse.c`
(`parse_iso`, `parse_eu`, `parse_us`, `parse_iso2`, `parse_jis`,
`parse_vms`, `parse_sla`, `parse_dot`, `parse_year`, `parse_mon`,
`parse_mday`, `parse_ddd`). It cannot be split across PRs — one Ruby test is
one TS `it` — so this story is that one test alone.

`Date._parse` is the one place RFC 0088 keeps a Ruby-shaped return in full (a
fragment object; `{}` for no match is load-bearing), so this slice has **no**
Temporal value-shape mismatch and is a straight port. `packages/date/src/date.ts`
already carries the machinery (the `_parse` cluster around `:1337`, `:1644`,
`:1712`, `:1810`, `:1902`); `date.trails.test.ts:38-200` covers a subset of
the same ground under trails-only names.

## Acceptance criteria

- [ ] `packages/date/src/test-date-parse.test.ts` exists and holds `_parse` with every assertion row of `test_date_parse.rb:8-435`.
- [ ] Rows the port genuinely does not answer yet are asserted against what it DOES answer only if that matches MRI; otherwise the row is left failing and the gap is filed as its own story rather than weakened.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
