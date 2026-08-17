---
title: "activemodel length_validation_test assertion parity"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: 6632
claim: "2026-08-17T09:27:13Z"
assignee: "assertions-activemodel-length-validation"
blocked-by: null
closed-reason: null
---

## Context

Re-filed out of `assertions-activemodel-length-numericality-comparison-refile`
(PR #6625 investigation), one story per file.

Rails: `vendor/rails/activemodel/test/cases/validations/length_validation_test.rb`
(499 lines). trails: `packages/activemodel/src/validations/length-validation.test.ts`
(657 lines).

Measured: **28 assertion-count + 41 assertion-kind + 0 assertion-value**
mismatches, over 41 matched tests (11 trails-only extras). The kind column is
almost entirely `predicate rails N vs trails 0` — Rails writes
`assert_predicate t, :invalid?` where the trails file writes
`expect(await t.isValid()).toBe(false)`.

This is the largest of the five files by mismatch count and the most mechanical:
the Rails tests are all `Topic.validates_length_of :title, …` plus
`assert_predicate` / `assert_equal t.errors[:title], [...]`, with no private
helper indirection.

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
