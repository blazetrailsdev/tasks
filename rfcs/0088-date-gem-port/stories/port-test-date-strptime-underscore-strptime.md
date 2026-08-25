---
title: "Port test_date_strptime.rb's Date._strptime fragment tables, including the fail table"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-date-strptime-frags."
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

- `test__strptime` (`test_date_strptime.rb:70-97`)
- `test__strptime__2` (`:98-119`)
- `test__strptime__3` (`:120-197`)
- `test__strptime__width` (`:198-245`)
- `test__strptime__fail` (`:246-305`)

`Date._strptime` answers a fragment object, so like `_parse` it is Ruby-shaped
by design and ports without a Temporal mismatch. Implementation:
`packages/date/src/date.ts` (the `date__strptime` cluster; trails-only coverage
at `date.trails.test.ts:418-500`) against
`vendor/date/ext/date/date_strptime.c`.

Two done stories already touched this exact ground —
`strptime-sec-fraction-numerator-is-a-number` and
`strptime-seconds-frag-is-a-number` — and RFC 0074's
`date-strptime-seconds-frag-producers` was migrated here specifically because it
"gains an anchor" from this file. Porting these five tests is what cashes that in.
`test__strptime__fail` is the negative table and is the most likely to surface a
too-permissive sub-parser.

## Acceptance criteria

- [ ] The five tests land in `test-date-strptime.test.ts` under their gem names.
- [ ] `_strptime__fail` rows return `nil`/undefined as MRI does — a port that succeeds where MRI fails is fixed here or filed, not asserted as-is.
- [ ] The `:leftover` key is asserted where the Ruby asserts it (`date.trails.test.ts:450` covers it trails-only today).
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
