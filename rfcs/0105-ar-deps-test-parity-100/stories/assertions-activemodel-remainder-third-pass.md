---
title: "assertions-activemodel-remainder-third-pass"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6642
claim: "2026-08-17T11:01:51Z"
assignee: "assertions-activemodel-remainder-third-pass"
blocked-by: null
closed-reason: null
---

## Context

Third pass over RFC 0105's activemodel assertion-parity cluster. The second
pass (`assertions-activemodel-remainder-second-pass`) converged
`model_test.rb` and `api_test.rb` to 0/0/0 and landed two comparator folds
(`raises`/`nothingRaised` negation in `scripts/test-compare/assertion-kinds.ts`,
leading-`:` symbol-token folding in `assertion-values.ts`), lowering the
activemodel mark from 415/623/65 to 408/610/63. The rest of the cluster is
still open.

Re-measure with:

    pnpm parity:test -- --assertions --missing --package activemodel

Per-file breakdown lives in
`scripts/test-compare/output/convention-comparison.json` (`assertionMismatches`
/ `kindMismatches` / `valueMismatches` per file) after a `--json` run.

Still open at the time of writing (count/kind/value), largest first:
`errors_test.rb`, `secure_password_test.rb`,
`serializers/json_serialization_test.rb`, `serialization_test.rb`,
`validations/i18n_validation_test.rb`, `error_test.rb`,
`attribute_methods_test.rb`, `attribute_set_test.rb`,
`attribute_registration_test.rb`, `dirty_test.rb`, `attributes_dirty_test.rb`,
`attribute_test.rb`, `type/integer_test.rb`, `attributes_test.rb`,
`attribute_assignment_test.rb`, `type/decimal_test.rb`,
`type/serialize_cast_value_test.rb`, `type/date_time_test.rb`,
`callbacks_test.rb`, `translation_test.rb`.

Two specific findings from the second pass:

- `type/decimal_test.rb` cannot fully converge without a Rational arm in
  `DecimalType`: `decimal.rb:64-66` routes a `::Numeric` (which Rational is)
  through `BigDecimal(value, precision || BIGDECIMAL_PRECISION)`, and
  `packages/activemodel/src/type/decimal.ts`'s `_castWithoutScale` has no
  Rational branch at all. `Rational` is exported from `@blazetrails/date`,
  which activemodel already depends on. Three of that file's tests assert on
  `Rational(1, 3)` / `Rational(2, 3)`.
- `translation_test.rb` is a full rewrite: our port asserts invented values
  (`"First name"`, `"Nested attribute"`) where Rails asserts i18n-loaded ones
  (`"person name attribute"`, `"Person Address Street"`) via
  `I18n.backend.store_translations` per test against `models/person.rb`.

## Acceptance criteria

- Each file taken on reports 0 assertion-count / -kind / -value mismatches in
  `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution; never raised.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
- Ship what fits one PR and file the rest as a further sibling story.
