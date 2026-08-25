---
title: "assertions-activemodel-remaining-validations-second-pass"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6620
claim: "2026-08-16T22:55:44Z"
assignee: "assertions-activemodel-length-numericality-comparison"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `assertions-activemodel-remaining-validations` (RFC 0105), whose PR
converged three of its eleven files — `validations/conditional_validation_test.rb`,
`validations/presence_validation_test.rb` and `validations/absence_validation_test.rb`
— and lowered `scripts/test-compare/assertion-mismatch-mark.json` for activemodel
from 456/687/65 to 433/661/65. The rest of that cluster is still open.

Re-measure with:

    pnpm parity:test -- --assertions --missing --package activemodel

Still open (count/kind/value, measured 2026-08-15 after that PR):

| Rails test file                               | count | kind | value |
| --------------------------------------------- | ----: | ---: | ----: |
| `validations/inclusion_validation_test.rb`    |    10 |   15 |     0 |
| `validations/with_validation_test.rb`         |     7 |   15 |     0 |
| `validations/exclusion_validation_test.rb`    |     7 |   11 |     0 |
| `validations/format_validation_test.rb`       |     6 |   10 |     0 |
| `validations/acceptance_validation_test.rb`   |     6 |   10 |     0 |
| `validations/callbacks_test.rb`               |     5 |    9 |     0 |
| `validations/confirmation_validation_test.rb` |     4 |    7 |     2 |
| `validations/validations_context_test.rb`     |     4 |    5 |     0 |

The dominant divergence class is the same one that PR converged: Rails asserts
`assert_predicate t, :invalid?` / `assert_empty t.errors[:title]` where our port
writes `expect(await t.isValid()).toBe(false)`. The settled shapes are
`assertPredicate(await t.isInvalid(), (invalid) => invalid)` and
`assertEmpty(t.errors.get("title"))` from `@blazetrails/activesupport`
(`packages/activesupport/src/testing/assertions.ts`); the tests also need to
mirror the Rails models (`Topic`, `Person`, `CustomReader` from
`vendor/rails/activemodel/test/models/`) rather than per-test invented `Person`
classes, since the assertion values (`["hoo 5"]`, `["must be blank"]`) come from
the Rails setup.

## Acceptance criteria

- Each file taken on reports 0 assertion-count / -kind / -value mismatches in
  `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution; never raised, and never lower a counter for a package
  this story did not touch.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
- Ship what fits one PR and file the rest as a further sibling story.
