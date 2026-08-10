---
title: "Port test_date_new.rb's jd/ordinal constructors and argument-type guards"
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
closed-reason: "Duplicate — covered by port-test-date-new-jd-ordinal-civil."
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

Ruby: `vendor/date/test/date/test_date_new.rb`

TS (convention path): `packages/date/src/test-date-new.test.ts`

Tests in scope:

- `test_jd` (`test_date_new.rb:7-28`)
- `test_jd__ex` (`:29-34`)
- `test_valid_with_invalid_types` (`:35-47`)
- `test_invalid_types` (`:48-84`)
- `test_ordinal` (`:85-110`)
- `test_ordinal__neg` (`:111-119`)
- `test_ordinal__ex` (`:120-128`)

The `Date.jd` / `Date.ordinal` constructors and the argument-type guards.
Implementation: `packages/date/src/date.ts` — `cOrdinalToJd` behind
`cValidOrdinalP` landed in the done story
`port-c-ordinal-to-jd-behind-c-valid-ordinal-p`, and `cCivilToJd`/`cJdToCivil`
in `port-c-civil-to-jd-and-c-jd-to-civil-at-their-rails-names`, both against
`vendor/date/ext/date/date_core.c`.

`test_invalid_types` and `test_valid_with_invalid_types` drive every constructor
with non-numeric arguments and assert `TypeError`; TS's static types make some of
these unreachable from TS callers, but the runtime guard must still fire because
the port is called from untyped JS and from `_parse` fragments. Where a row is
genuinely unexpressible, keep the test and cast at the call site rather than
dropping the row.

## Acceptance criteria

- [ ] The seven tests land in `test-date-new.test.ts` under their gem names.
- [ ] `test_invalid_types` rows assert a runtime `TypeError`, reached via an explicit cast where TS would otherwise reject the call — no row is dropped for being untypeable.
- [ ] Negative-ordinal counting matches `c_valid_ordinal_p` (already covered trails-only at `date.trails.test.ts:304`).
- [ ] Test names mirror the gem's `def test_*` names exactly (CLAUDE.md: test names are never reworded); `pnpm parity:test` credits them and the `date` package total rises by the count above.
- [ ] No coverage is deleted from `date.trails.test.ts`; where a ported gem test subsumes a trails-only `it`, the trails-only one is removed in the same PR and the removal is noted in the PR body.
- [ ] Assertion-value mismatches arising from Temporal returns are left alone, not "fixed".
