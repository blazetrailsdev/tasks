---
title: "F-6b — repair_validations test helper"
status: done
updated: 2026-06-09
rfc: "0016-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 50
blocked-by: null
pr: 3062
---

## Context

Rails uses `repair_validations(Model) do ... end` in several test files
(including `nested_attributes_test.rb`) to temporarily add validators inside
a test body and restore the original validator set on teardown. Trails has no
equivalent. Without it, any test that calls `this.validates(...)` on a
canonical model class leaks the validator into subsequent tests in the same
file.

This is a prerequisite for migrating `nested-attributes.test.ts` to canonical
`Human`/`Interest` models (the NVP "validate presence of parent" test adds
`validates presence: true` on `Interest`, which would leak without teardown).

## Acceptance criteria

- [ ] `repairValidations(Model, fn)` (or equivalent vitest `afterEach` helper)
      in `test-helpers/` that saves and restores the model's validator list
      around the callback.
- [ ] Matches Rails `repair_validations` semantics: validators added inside
      `fn` are removed after `fn` returns (even on throw).
- [ ] At least one test covering the restore-on-throw path.

## Notes

Rails source: `activerecord/test/support/connection.rb` and usages in
`nested_attributes_test.rb:862–872` (`repair_validations(Interest) do`).
