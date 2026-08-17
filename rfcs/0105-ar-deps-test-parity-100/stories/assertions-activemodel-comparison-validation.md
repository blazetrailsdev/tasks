---
title: "activemodel comparison_validation_test assertion parity"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps:
  - comparison-validator-check-validity-message-and-temporal-pairs
deps-rfc: []
est-loc: 500
priority: null
pr: 6626
claim: "2026-08-17T01:42:50Z"
assignee: "port-hwia-defaults-family"
blocked-by: null
closed-reason: null
---

## Context

Re-filed out of `assertions-activemodel-length-numericality-comparison-refile`
(PR #6625 investigation): that story named five files, and each one exceeds the
700-LOC PR ceiling on its own, so it is split per file.

Rails: `vendor/rails/activemodel/test/cases/validations/comparison_validation_test.rb`
(336 lines). trails: `packages/activemodel/src/validations/comparison-validation.test.ts`
(567 lines).

Measured: **14 assertion-count + 33 assertion-kind + 0 assertion-value**
mismatches, over 33 matched tests (13 trails-only extras).

The Rails file drives everything through `Topic.validates_comparison_of :approved, …`
against a `Topic` with a bare `attr_accessor :approved` — in trails,
`this.attribute("approved", "value")` (the untyped `ValueType`, registry.ts:47)
is the faithful spelling — plus the two private helpers
`assert_invalid_values(values, error = nil)` / `assert_valid_values(values)` and
`with_each_topic_approved_value`.

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

## Two implementation blockers found under this port

Both are in `packages/activemodel/src/validations/comparison.ts` and must land
with (or before) the test port, since the ported tests exercise them:

- `checkValidity()` raises the pre-Rails-7 message
  `"One of :greater_than, … must be supplied"`. Rails raises
  `"Expected one of :greater_than, :greater_than_or_equal_to, :equal_to, :less_than, :less_than_or_equal_to, or :other_than option to be supplied."`
  (comparison.rb:13-17), which is what
  `test_validates_comparison_of_no_options` asserts verbatim.
- `private compare()` throws `ArgumentError` for a `Temporal.PlainDate` /
  `Temporal.PlainDateTime` pair, because it only compares same-class Temporal
  values. Rails compares `Date.parse("2020-08-02")` against
  `DateTime.new(2020, 8, 1, 12, 34)` through `Comparable` without complaint, and
  nine of the tests below mix the two in one `assert_invalid_values` array.

`test_validates_comparison_with_custom_compare` builds a `Struct` that
`include Comparable` and defines `<=>`; decide at port time whether trails has a
faithful spelling for that (Ruby's `<=>` protocol has no JS twin) or whether the
case needs its own story.
