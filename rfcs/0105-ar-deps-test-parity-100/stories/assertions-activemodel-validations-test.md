---
title: "activemodel validations_test assertion parity"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: 6638
claim: "2026-08-17T10:13:50Z"
assignee: "assertions-activemodel-validations-test"
blocked-by: null
closed-reason: null
---

## Context

Re-filed out of `assertions-activemodel-length-numericality-comparison-refile`
(PR #6625 investigation), one story per file.

Rails: `vendor/rails/activemodel/test/cases/validations_test.rb` (490 lines).
trails: `packages/activemodel/src/validations.test.ts` (2,474 lines).

Measured: **29 assertion-count + 37 assertion-kind + 0 assertion-value**
mismatches, over 45 matched tests (146 trails-only extras).

This is by far the biggest trails file of the five and carries 146 trails-only
tests, so budget the split before starting: the extras belong in
`validations.trails.test.ts` (CLAUDE.md), and moving them is itself most of a
PR. Splitting this story again by test group (`errors on base`, `validation
order`, the validator-list tests, the strict-validation tests) is expected and
fine.

## Why this is a re-port, not an assertion edit

Measured 2026-08-16 with `pnpm parity:test -- --assertions --package activemodel`
after a full `pnpm build`. The trails file matches Rails only by `it(...)` name:
every body declares its own ad-hoc inline model and asserts an invented
scenario, so there is no assertion to "adjust" onto the Rails one. Converging
means porting the Rails test file — its models, its per-test bodies, its
assertion kinds in order — over the top of the existing file.

Follow the shape already proven green in
`packages/activemodel/src/validations/absence-validation.test.ts`: models
declared once at file scope with a `Mirrors: activemodel/test/models/*.rb`
comment, `afterEach` calling `clearValidatorsBang()`, and `assertPredicate` from
`@blazetrails/activesupport` wherever Rails writes `assert_predicate` (a bare
`expect(...).toBe(true)` normalizes to `equal`, not `predicate`, and is what
produces most of the kind deltas below).

Where the Rails file delegates to a private helper whose name starts with
`assert_` (`assert_valid_values` / `assert_invalid_values`), port the helper
under the camelCased name and call it at the same sites: both extractors treat
an `assert*` callee as ONE assertion with its own name as the kind, and both
sides then normalize to _unmapped_, so the counts line up and no kind delta is
produced. Inlining the helper is what turns 2 Rails assertions into N trails
`equal`s today.

## Acceptance criteria

- The file reports 0 assertion-count, 0 assertion-kind and 0 assertion-value
  mismatches in `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  file's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope).
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- Any trails-only extra test worth keeping moves to the sibling
  `*.trails.test.ts`, per CLAUDE.md.
