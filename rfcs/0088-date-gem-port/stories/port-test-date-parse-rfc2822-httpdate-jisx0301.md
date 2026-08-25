---
title: "Port test_date_parse.rb's _rfc2822/_httpdate/_jisx0301 fragment parsers"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 260
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

- `test__rfc2822` (`:980-1016`)
- `test__httpdate` (`:1017-1041`)
- `test__jisx0301` (`:1042-1122`)

The remaining fragment parsers. `_jisx0301` is the Japanese-era format
(`parse_jis`, covered trails-only at `date.trails.test.ts:193`); `_rfc2822` and
`_httpdate` are the mail/HTTP wire formats and carry named-zone offsets through
`date_zone_to_diff` (`vendor/date/ext/date/date_parse.c:523`), which the port
answers as a `number` (`date.trails.test.ts:591`).

## Acceptance criteria

- [ ] The three tests land under their gem names.
- [ ] Named zones (`GMT`, `EST`, …) resolve through the port's `date_zone_to_diff` equivalent and answer offsets in seconds.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
