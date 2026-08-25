---
title: "Port test_date.rb — constants, sub, eql?, hash, freeze, infinity comparison, deconstruct_keys"
status: closed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps:
  - port-date-infinity-from-lib-date-rb
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of port-test-date (same 9 tests of test_date.rb). Its Date::Infinity dependency is preserved as the standalone story port-date-infinity-from-lib-date-rb."
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

Ruby: `vendor/date/test/date/test_date.rb`

TS (convention path): `packages/date/src/test-date.test.ts`

Tests in scope:

- `test_range_infinite_float` (`test_date.rb:9-22`)
- `test__const` (`:23-46`)
- `test_sub` (`:47-110`)
- `test_eql_p` (`:111-126`)
- `test_hash` (`:127-148`)
- `test_freeze` (`:149-156`)
- `test_submillisecond_comparison` (`:157-165`)
- `test_infinity_comparison` (`:166-178`)
- `test_deconstruct_keys` (`:179-207`)

The gem's own top-level suite. Three of these need surface the port does not have
yet, and each is a real decision rather than a mechanical port:

- `test_range_infinite_float` and `test_infinity_comparison` need
  `Date::Infinity` — the ONLY Ruby-visible class in the gem
  (`vendor/date/lib/date.rb:18-77`, 12 methods) and today entirely absent from
  `packages/date/src/date.ts` (which has only the unrelated `JULIAN`/`GREGORIAN`
  `±Infinity` sentinels at `:2952-2959`). Port it as part of the sibling story
  `port-date-infinity-from-lib-date-rb` and depend on that, or ship it here if
  it fits.
- `test_deconstruct_keys` is Ruby pattern matching (`case/in`). The method
  itself is ordinary — it answers a Hash of `:year`/`:month`/`:day`/… — so port
  `deconstruct_keys` and assert the Hash directly; only the `case/in` syntax has
  no analogue.
- `test_hash` and `test_eql_p` need value-equality semantics; assert what the
  port answers and fix the port where it disagrees with MRI.

## Acceptance criteria

- [ ] The nine tests land in `packages/date/src/test-date.test.ts` under their gem names.
- [ ] `deconstruct_keys` exists on `Date` at its gem name and answers MRI's key set.
- [ ] `Date::Infinity` is available (via `port-date-infinity-from-lib-date-rb` or in this PR) so the two infinity tests assert real behavior.
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
