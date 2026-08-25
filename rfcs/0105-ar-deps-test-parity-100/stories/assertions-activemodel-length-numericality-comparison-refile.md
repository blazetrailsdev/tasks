---
title: "activemodel length / numericality / comparison / validates assertion parity"
status: closed
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by one story per file (PR #6625 measurement): assertions-activemodel-comparison-validation, assertions-activemodel-length-validation, assertions-activemodel-numericality-validation, assertions-activemodel-validations-test, assertions-activemodel-validates-test. Each of the five trails files matches Rails by test name only — every body is an invented scenario over an ad-hoc inline model — so convergence is a re-port of the Rails file, not an assertion edit, and the smallest of them (comparison-validation.test.ts, 567 lines to delete plus ~200 to add) already exceeds the 700-LOC PR ceiling on its own; validations.test.ts is 2,474 lines with 146 trails-only extras. Two implementation blockers were also surfaced and filed: Model.validates has no Rails-style validator lookup by option key (converge-model-validates-onto-rails-generic-lookup), and ComparisonValidator#compare throws on a PlainDate/PlainDateTime pair Ruby compares fine."
---

## Why this story exists

`assertions-activemodel-length-numericality-comparison` was bundled into PR
(#6620) but **never started** — it was released untouched, and the PR carried no
`Closes-story` trailer for it. The post-merge hook's branch-name fallback still
marked it `done #6620` (the branch was named after it), and `done` has no
reverse transition, so this story re-files the identical, still-unstarted work.
Nothing in #6620 touched any file below; re-measure before trusting the table.

RFC 0105 counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number, a different kind, or a different
expected value than the Rails test is not a port of that test. PR #6507 widened
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:76-88`) from
activerecord alone to the full RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values,
surfacing 5,036 divergences across the non-AR packages. The triage story
`burn-down-non-ar-assertion-parity-debt` split that total into this cluster and
its siblings; this one burns down the `activemodel` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package activemodel`),
against `vendor/rails/activemodel/test/cases/`:

| Rails test file                               | count | kind | value |
| --------------------------------------------- | ----: | ---: | ----: |
| `validations/length_validation_test.rb`       |    29 |   41 |     0 |
| `validations_test.rb`                         |    29 |   37 |     0 |
| `validations/numericality_validation_test.rb` |    15 |   41 |     0 |
| `validations/comparison_validation_test.rb`   |    14 |   33 |     0 |
| `validations/validates_test.rb`               |    14 |   21 |     0 |

**274 divergences** (101 assertion-count, 173 assertion-kind, 0
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package activemodel` and grep for the
file; each line prints `rails N vs trails M`, and the kind lines print the
per-kind delta. The trails counterparts are at the convention TS path the same
report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values (`assert_equal` -> `toEqual`, `assert_nil` -> `toBeNull`,
`assert_predicate`/`assert` -> the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key), and never loosen the
Rails side or reseed the mark upward.

If the cluster is larger than one PR, ship the files that fit and file the rest
as a sibling story under this RFC rather than growing the PR.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
