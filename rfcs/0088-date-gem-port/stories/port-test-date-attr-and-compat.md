---
title: "Port test_date_attr.rb and test_date_compat.rb — 4 tests, closes two unported files"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — the 2026-08-09 19:12 sweep already filed port-test-date-attr and port-test-date-compat for the same two files. Filed from a stale local tasks checkout."
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

Ruby: `vendor/date/test/date/test_date_attr.rb + test_date_compat.rb`

TS (convention path): `packages/date/src/test-date-attr.test.ts + test-date-compat.test.ts`

Tests in scope:

- `test__attr` (`test_date_attr.rb:7-72`)
- `test__wday_predicate` (`test_date_attr.rb:73-89`)
- `test_nth_kday` (`test_date_attr.rb:90-103`)
- `test_compat` (`test_date_compat.rb:7-22`)

Two small files bundled because neither fills a PR alone (CLAUDE.md: bundle small
related changes). Together they are 4 tests and 125 Ruby lines, and they close
**two** of the ten unported files at once — the cheapest file-count movement in
the package.

`test__attr` is the whole reader surface (`year`, `mon`, `mday`, `yday`,
`wday`, `cwyear`, `cweek`, `cwday`, `jd`, `mjd`, `ld`, `ajd`, `amjd`,
`day_fraction`, `start`, `julian?`, `gregorian?`, …). Trails-only coverage of
the wday counting sits at `date.trails.test.ts:639`; the JDN helper layer behind
`cwyear`/`cweek` landed in `port-the-jdn-helper-layer-behind-wnumx-and-cwyear`
(done). `test__wday_predicate` is `sunday?`..`saturday?`. `test_compat` is the
`Date`/`Time` compatibility shim.

Note the two files are separate TS files at the convention paths above — one PR,
two new files.

## Acceptance criteria

- [ ] `test-date-attr.test.ts` and `test-date-compat.test.ts` both exist and `parity:test` shows `date` at 4 more credited tests and **2 more credited files**.
- [ ] Every reader `test__attr` names exists on `Date` at its gem name; a missing one is added (they are one-liners over state the port already holds), not skipped.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
