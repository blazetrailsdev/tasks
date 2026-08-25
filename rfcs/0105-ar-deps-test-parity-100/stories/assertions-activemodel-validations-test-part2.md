---
title: "assertions-activemodel-validations-test-part2"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps:
  - assertions-activemodel-validations-test
deps-rfc: []
est-loc: null
priority: null
pr: 6647
claim: "2026-08-17T11:54:39Z"
assignee: "assertions-activemodel-validations-test-part2"
blocked-by: null
closed-reason: null
---

## Context

Follow-up slice of `assertions-activemodel-validations-test` (PR pending). That
PR ported the errors/validator-list half of
`vendor/rails/activemodel/test/cases/validations_test.rb` (490 lines) onto
`packages/activemodel/src/validations.test.ts`, taking the file from
29 assertion-count + 37 assertion-kind mismatches down to
**14 count + 19 kind**. It stopped at the 700 LOC ceiling; the story file
anticipated the split ("Splitting this story again by test group is expected
and fine").

It also landed the file-scope Rails models the remaining tests need — `Topic`,
`Reply`, `Person`, `CustomReader`, each with a
`Mirrors: activemodel/test/models/*.rb` comment — plus an `afterEach` calling
`clearValidatorsBang()`, so the remaining bodies can be written directly
against them.

Still divergent (per `pnpm parity:test -- --assertions --missing --package activemodel`):

- invalid options to validate (rails 2 vs trails 1)
- callback options to validate (rails 3 vs trails 2)
- errors to json (rails 2 vs trails 1)
- validation order (rails 12 vs trails 1)
- validation with if and on (rails 4 vs trails 2)
- invalid should be the opposite of valid (rails 3 vs trails 2)
- validations on the instance level (rails 3 vs trails 2)
- validate with bang (rails 1 vs trails 2)
- validate with bang and context (rails 2 vs trails 1)
- strict validation error message (rails 2 vs trails 1)
- dup validity is independent (rails 3 vs trails 2)
- validation with message as proc that takes record and data as a parameters (rails 2 vs trails 1)
- frozen models can be validated (rails 2 vs trails 1)
- validations some with except (rails 3 vs trails 1)

plus kind-only deltas on: validation with message as proc, validate,
strict validation not fails, validates with false hash value,
validate with except on.

Known blockers to check before writing:

- `Model.validates` is `validates(attribute, rules)`; Rails is
  `validates(*attributes, options)` (activemodel/lib/active_model/validations/validates.rb:105).
  `test_validations_on_the_instance_level` (validations_test.rb:322) needs the
  variadic form. Converge it — do not work around it with two calls.
- `assert_not_predicate` (validations_test.rb:270) has no trails helper.
  `assertNotPredicate` belongs next to `assertNotSame`/`assertNotEmpty` in
  `packages/activesupport/src/testing/assertions.ts` (same
  `@noRailsEquivalent PERMANENT — Minitest` shape); a bare
  `expect(...).not.toBe(true)` normalizes to `notEqual`, not `notPredicate`.
- `Topic.validate :i_dont_exist` must raise `NoMethodError` at validation time
  (validations_test.rb:160); trails' `Model.validate` silently no-ops on an
  unknown method name (model.ts, the `typeof r[methodOrFn] === "function"`
  arm).
- `Topic.validate :title, presence: true` must raise `ArgumentError` with
  the message at validations_test.rb:173 (unknown key `:presence`, valid keys
  `:on`/`:if`/`:unless`/`:prepend`/`:except_on`, plus the "did you mean
  validates" hint)
  (validations_test.rb:168-175).
- `except_on:` (validations_test.rb:466, 477) — check it exists before porting.
- `dup` / `freeze` fidelity for `test_dup_validity_is_independent` (428) and
  `test_frozen_models_can_be_validated` (459).

Also still outstanding from the parent story's acceptance criteria: the
146 trails-only extras in `validations.test.ts` (the nested `describe("presence")`
/ `describe("absence")` / `describe("length")` … blocks, `describe("return-shape
parity")`, `describe("_validators hash-of-arrays")`, plus the three
`read_attribute_for_validation` / "validates an undeclared getter via the send
default" tests) belong in a sibling `validations.trails.test.ts` per CLAUDE.md.
That move is large enough to be its own PR — split it if it does not fit.

## Acceptance criteria

- `validations_test.rb` reports 0 assertion-count, 0 assertion-kind and
  0 assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` activemodel counters are
  lowered by exactly this slice's contribution (only-shrink; never hand-raised).
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
