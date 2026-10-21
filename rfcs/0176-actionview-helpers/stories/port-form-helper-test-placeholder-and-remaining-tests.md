---
title: "port-form-helper-test-placeholder-and-remaining-tests"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - placeholderable-inlined-into-text-field-and-text-area
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9172
claim: "2026-10-21T14:03:48Z"
assignee: "port-form-helper-test-placeholder-and-remaining-tests"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` (forced run, 2026-10-20) reports
`template/form_helper_test.rb` at 226 matched / **102 missing** of 328.
`packages/actionview/src/template/form-helper.test.ts` exists;
`port-form-helper-test-form-for-and-fields-for-suite` and its `-remainder` are
both `done`, so nothing open covers the residue.

The missing block opens on the `placeholder` family — `text field placeholder
with locales`, `... and to model`, `... with human attribute name`, `... and
value`, `... with locales and value`, `... with locales and nested attributes`
— which is the test surface of
`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/placeholderable.rb`,
a module trails has no file for (see the placeholderable story). Also missing:
`tags base child without render method`.

## Acceptance criteria

- Every Rails test in `form_helper_test.rb` has a counterpart in
  `template/form-helper.test.ts` at the Rails name.
- The `placeholder` family passes against the ported `Placeholderable`
  inlining, or is `it.skip` with `BLOCKED: <that story id>` until it lands.
- `pnpm parity:test --package actionview` shows 0 missing for this file.
- Ship what fits in one PR; file the rest as a `-remainder` naming the tests
  still owed.
