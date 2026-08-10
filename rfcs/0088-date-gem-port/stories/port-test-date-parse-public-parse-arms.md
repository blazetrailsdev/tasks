---
title: "Port test_date_parse.rb's public Date.parse arms, error table and length limit"
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

- `test_parse` (`:549-562`)
- `test_parse__2` (`:563-581`)
- `test_parse__time` (`:605-625`)
- `test_parse__comp` (`:626-657`)
- `test_parse__d_to_s` (`:658-665`)
- `test_parse_utf8` (`:666-677`)
- `test_parse__ex` (`:678-713`)
- `test_given_string` (`:1233-1276`)
- `test_length_limit` (`:1277-1304`)

The public `Date.parse` / `DateTime.parse` surface over `_parse`. This is the
first slice where RFC 0088's Temporal default is visible: `Date.parse` answers a
`Temporal.PlainDate`, so `assert_equal Date.new(2001,2,3), Date.parse(...)`
becomes a `Temporal.PlainDate` comparison. Both sides are constructor calls, so
`assertion-values.ts` emits `null` and the value mark cannot rise — see the RFC's
"Enrollment result" section.

`test_parse__ex` exercises the error arms; the port raises `Date::Error`
subclassing `ArgumentError` (covered today at `date.trails.test.ts:632`).
`test_length_limit` and `test_given_string` are the `limit:` kwarg and the
frozen/tainted-string arms.

## Acceptance criteria

- [ ] All nine tests land under their gem names.
- [ ] `parse__ex` asserts `Date::Error` (an `ArgumentError` subclass), matching `date.trails.test.ts:632`.
- [ ] The `limit:` kwarg is honoured as `date_parse.c` honours it, or the gap is filed as its own story.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
