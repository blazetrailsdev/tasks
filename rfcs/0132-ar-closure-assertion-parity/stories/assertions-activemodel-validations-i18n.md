---
title: "assertions-activemodel-validations-i18n"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7946
claim: "2026-09-22T01:57:04Z"
assignee: "assertions-activemodel-validations-i18n"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-activemodel-validations-remainder-3`, which converged
format / inclusion / with / acceptance validation tests to 0 mismatches but hit
the PR LOC ceiling before `validations/i18n_validation_test.rb` (60 missing
assertions per `pnpm parity:test -- --package activemodel --assertions --missing`).

- Rails: `vendor/rails/activemodel/test/cases/validations/i18n_validation_test.rb`
- trails: `packages/activemodel/src/validations/i18n-validation.test.ts`

Mismatches are mostly the `generated message` def_test families (rails 1 vs trails 2 —
Rails asserts via a single `assert_called_with`-style mock on `errors.generate_message`),
and the `errors full messages ...` family (rails 2 vs trails 1).

Pattern: `packages/activemodel/src/validations/exclusion-validation.test.ts`,
canonical `Topic`/`Person` from `src/test-helpers/models/`, `Topic.clearValidatorsBang()`
in `afterEach`.

## Acceptance criteria

- [ ] `validations/i18n_validation_test.rb` reports 0 assertion-count / kind / value mismatches.
- [ ] No test renamed; activemodel name-gate percent does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
