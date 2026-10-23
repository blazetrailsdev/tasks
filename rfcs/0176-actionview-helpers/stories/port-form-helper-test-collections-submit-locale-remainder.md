---
title: "port-form-helper-test-collections-submit-locale-remainder"
status: done
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9277
claim: "2026-10-23T18:47:27Z"
assignee: "actionview-test-fixtures-under-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`port-form-helper-test-placeholder-and-remaining-tests-remainder` ported the
plain `form for` block family (utf8, method, remote, index, namespace, symbol
as, format, search field), `fields for with namespace`, `fields for with file
field generate multipart`, `form for label error wrapping block and non block
versions` and `form for with collection radio buttons` into
`packages/actionview/src/template/form-helper.test.ts`, then hit the LOC
ceiling. These tests from
`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb` remain.
Reuse the file's `formFor` / `wholeForm` / `hiddenFields` helpers.

## Acceptance criteria

- Each test below exists in `template/form-helper.test.ts` at the Rails name,
  passing, or `it.skip` with a `BLOCKED: <story-id>` line.
- `pnpm parity:test --package actionview` shows 0 missing for
  `template/form_helper_test.rb`.

Tests still owed:

- `form for label error wrapping` (form_helper_test.rb:2514)
- `form for label error wrapping without conventional instance variable` (:2530)
- `form for with collection radio buttons with custom builder block` (:1983)
- `form for with collection radio buttons with custom builder block does not leak the template` (:2007)
- `form with namespace and with collection radio buttons` (:2034)
- `form with index and with collection radio buttons` (:2053)
- `form for with collection checkboxes` and its custom-builder-block pair,
  `form with namespace and with collection checkboxes`,
  `form with index and with collection checkboxes`
- `form for with persisted to model` (:2187), `form for with new record to model` (:2197) — need `RecordForm = Struct.new(:to_model, keyword_init: true)`
- `form for with model using relative model naming` (:2257) — needs `Blog::Post` fake model
- `form tags do not call private properties on form object` (:2294)
- `inputs dont use before type cast when value did not come from user`
- `inputs use before type cast to retain information from validations like numericality`
- `inputs use before typecast when object doesnt respond to came from user`
- `submit with object as existing record and locale strings`
- `submit with object as new record and locale strings`
- `submit with object which is namespaced`
- `submit with object which is overwritten by as option`
- `submit without object and locale strings`
