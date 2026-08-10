---
title: "Port test_date_arith.rb's prev_*/next_* family, including month-end clamping"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-arith-operators / port-test-date-arith-iteration."
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

- `test_prev` (`:100-106`)
- `test_prev_day` (`:107-118`)
- `test_prev_month` (`:119-130`)
- `test_prev_month__2` (`:131-141`)
- `test_prev_year` (`:142-152`)
- `test_next` (`:153-173`)
- `test_next_day` (`:174-185`)
- `test_next_month` (`:186-196`)
- `test_next_month__2` (`:197-207`)
- `test_next_year` (`:208-218`)

The `prev_*` / `next_*` family. These are the methods ActiveSupport's
`core_ext/date/calculations.rb` reopens `Date` to build on, and the done story
`activesupport-core-ext-date-calculations-on-date-class` already routed AS's
calculations onto this class — so these tests measure a surface that has
production consumers, not just the gem.

The `__2` variants are the end-of-month clamping arms (Jan 31 → Feb 28/29), which
is exactly where `Temporal.PlainDate.add`'s default `overflow: "constrain"`
either agrees with Ruby or does not; assert the Ruby answer and fix the port if
they disagree.

## Acceptance criteria

- [ ] The ten tests land under their gem names.
- [ ] Month-end clamping matches MRI on both `next_month` and `prev_month`, including leap years; a Temporal `overflow` default that disagrees is corrected in `packages/date/src/date.ts`, not in the test.
- [ ] Returns are Temporal types per the RFC's return table.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
