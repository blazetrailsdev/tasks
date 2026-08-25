---
title: "Port test_date_parse.rb's six public wire-format constructors"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 200
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

- `test_iso8601` (`:1123-1135`)
- `test_rfc3339` (`:1136-1148`)
- `test_xmlschema` (`:1149-1161`)
- `test_rfc2822` (`:1162-1182`)
- `test_httpdate` (`:1183-1195`)
- `test_jisx0301` (`:1196-1232`)

The public constructors over the six fragment parsers above —
`Date.iso8601`, `.rfc3339`, `.xmlschema`, `.rfc2822`, `.httpdate`,
`.jisx0301` and their `DateTime` twins. Each is a thin `d_new_by_frags` /
`dt_new_by_frags` over its `_`-prefixed parser
(`vendor/date/ext/date/date_core.c:4315`, `:8311`), both of which are already
exported from `packages/date/src/index.ts` as `dNewByFrags` / `dtNewByFrags`.

Depends on nothing, but reads best after the fragment-parser slices; if a
constructor is missing from the port entirely, add it here — it is small — or
file it.

## Acceptance criteria

- [ ] All six tests land under their gem names.
- [ ] Any constructor the port does not yet export is added at its Rails/gem name, not worked around in the test.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
