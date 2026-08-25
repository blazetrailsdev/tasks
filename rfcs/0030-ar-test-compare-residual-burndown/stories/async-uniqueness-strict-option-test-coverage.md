---
title: "Direct test coverage for strict: on async uniqueness validations"
status: done
updated: 2026-06-19
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 3647
claim: "2026-06-19T15:00:25Z"
assignee: "async-uniqueness-strict-option-test-coverage"
blocked-by: null
---

## Context

PR #3627 (async-validations-honor-validation-context) made
`Base#_runAsyncValidations` honor `on:`/`if:`/`unless:`/`strict:` on deferred
uniqueness validators. The `strict:` key is forwarded to `UniquenessValidator`
(constructor → `options`), and `errors.add` reads it to raise
`StrictValidationFailed` (mirroring Rails errors.rb:342-354). However the PR's
direct tests in `packages/activerecord/src/validations/uniqueness-validation.test.ts`
only cover `on: 'create'` / `on: 'update'` for both `validates(..., { uniqueness })`
and `validatesUniqueness`; the `strict:` path is wired but has no direct test.

## Acceptance criteria

- [ ] Direct test(s) in `uniqueness-validation.test.ts` asserting
      `validatesUniqueness('attr', { strict: true })` (and the equivalent
      `validates('attr', { uniqueness: true, strict: true })`) raises
      `StrictValidationFailed` on a duplicate, rather than only adding an error.
- [ ] Match the corresponding Rails test name if one exists in
      `uniqueness_validation_test.rb`; otherwise descriptive coverage.
