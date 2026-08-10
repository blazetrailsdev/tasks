---
title: "Port test_switch_hitter.rb's readers, comparisons and reform-period walks"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate — covered by port-test-switch-hitter-compare-marshal."
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

Ruby: `vendor/date/test/date/test_switch_hitter.rb`

TS (convention path): `packages/date/src/test-switch-hitter.test.ts`

Tests in scope:

- `test_zone` (`:268-272`)
- `test_to_s` (`:273-281`)
- `test_inspect` (`:282-288`)
- `test_strftime` (`:289-299`)
- `test_cmp` (`:300-317`)
- `test_eqeqeq` (`:318-333`)
- `test_period` (`:334-467`)
- `test_period2` (`:468-477`)
- `test_different_alignments` (`:478-530`)
- `test_enc` (`:571-610`)
- `test_dup` (`:611-624`)
- `test_base` (`:625-637`)

The reader/format/comparison half of the reform suite. `test_period` (134 lines)
walks the whole reform window day by day, so it is the bulk. `test_marshal14`,
`test_marshal16`, `test_marshal18` and `test_marshal192` are already excluded
via `UNPORTED_FILES` (`scripts/parity/unported-files.ts`) as Ruby's Marshal wire
format — do not port them and do not add new exclusions.

`test_inspect` prints Ruby's object `inspect`; per RFC 0074's disposition the
`inspect` family is out of scope and tracked in RFC 0023
(`i18n-inspect-stories-are-ruby-object-inspect`). If `test_inspect` cannot be
made to pass without an `inspect` port, leave it out of this PR and add a
`UNPORTED_FILES` per-test entry ONLY if a maintainer agrees; the default is to
file the `inspect` gap as its own story and leave the test red.

## Acceptance criteria

- [ ] The listed tests land under their gem names; the four `marshal*` tests stay excluded and unwritten.
- [ ] `test_period` walks the same day range the Ruby does, not a sampled subset.
- [ ] Any test left unported carries a filed story ID in the PR body — no silent omissions.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
