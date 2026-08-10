---
title: "Port test_date_arith.rb's step/upto/downto, block and blockless forms"
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
closed-reason: "Duplicate — covered by port-test-date-arith-iteration."
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

- `test_downto` (`:219-228`)
- `test_downto__noblock` (`:229-235`)
- `test_upto` (`:236-245`)
- `test_upto__noblock` (`:246-252`)
- `test_step` (`:253-268`)
- `test_step__noblock` (`:269-278`)
- `test_step__compare` (`:279-294`)

`Date#step` / `#upto` / `#downto`. Each has a block form and a blockless form
that answers an `Enumerator`. The block form is a callback in TS; the blockless
form needs an iterable — port it as a generator/iterator, which is the settled
trails idiom for a Ruby `Enumerator`, and keep the Ruby method names.

`test_step__compare` drives `step` with a custom-`<=>` object, which is Ruby
duck typing with no direct TS analogue; if it cannot be expressed, file it rather
than dropping it silently.

Implementation target: `packages/date/src/date.ts` — if `step`/`upto`/`downto`
are absent from the port entirely, adding them is part of this story (they are
short: `vendor/date/ext/date/date_core.c`'s `d_lite_step` and friends).

## Acceptance criteria

- [ ] The seven tests land under their gem names.
- [ ] The blockless forms answer an iterable at the gem's names, not a materialised array named something else.
- [ ] If `step`/`upto`/`downto` are missing from `packages/date/src/date.ts`, they are added here at their gem names; if that pushes the PR over the LOC ceiling, the implementation is filed as its own story and this one blocks on it.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
