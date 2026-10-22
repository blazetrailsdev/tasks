---
title: "port-form-helper-test-placeholder-and-remaining-tests-remainder"
status: claimed
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: "2026-10-22T16:53:09Z"
assignee: "globalid-locate-many-index-by-converges"
blocked-by: null
closed-reason: null
---

## Context

`port-form-helper-test-placeholder-and-remaining-tests` ported the placeholder
family, the date/time/month/week field tests, explicit id/name, nil id, index,
auto index and `tags base child without render method` into
`packages/actionview/src/template/form-helper.test.ts`. The tests below from
`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb` still have no
counterpart (mostly the `form_for` block, plus submit-with-object locale tests
and the before-type-cast tests). Reuse the file's existing `formFor` /
`wholeForm` / `hiddenFields` helpers.

## Acceptance criteria

- Each test below exists in `template/form-helper.test.ts` at the Rails name,
  passing, or `it.skip` with a `BLOCKED: <story-id>` line where an unported
  helper blocks it.
- `pnpm parity:test --package actionview` shows 0 missing for
  `template/form_helper_test.rb`.

Tests still owed:

- `fields for with file field generate multipart`
- `fields for with namespace`
- `form for`
- `form for default enforce utf8 false`
- `form for default enforce utf8 true`
- `form for enforce utf8 false`
- `form for enforce utf8 true`
- `form for id`
- `form for is not affected by form with generates ids`
- `form for label error wrapping`
- `form for label error wrapping block and non block versions`
- `form for label error wrapping without conventional instance variable`
- `form for with collection checkboxes`
- `form for with collection checkboxes with custom builder block`
- `form for with collection checkboxes with custom builder block does not leak the template`
- `form for with collection radio buttons`
- `form for with collection radio buttons with custom builder block`
- `form for with collection radio buttons with custom builder block does not leak the template`
- `form for with format`
- `form for with index`
- `form for with method`
- `form for with method as part of html options`
- `form for with model using relative model naming`
- `form for with namespace`
- `form for with namespace and as option`
- `form for with namespace with date select`
- `form for with namespace with label`
- `form for with new record to model`
- `form for with nil index option override`
- `form for without object`
- `form for with persisted to model`
- `form for with remote`
- `form for with remote in html`
- `form for with remote without html`
- `form for with search field`
- `form for with symbol as`
- `form tags do not call private properties on form object`
- `form with index and with collection checkboxes`
- `form with index and with collection radio buttons`
- `form with namespace and with collection checkboxes`
- `form with namespace and with collection radio buttons`
- `inputs dont use before type cast when value did not come from user`
- `inputs use before type cast to retain information from validations like numericality`
- `inputs use before typecast when object doesnt respond to came from user`
- `new form for without format`
- `submit with object as existing record and locale strings`
- `submit with object as new record and locale strings`
- `submit with object which is namespaced`
- `submit with object which is overwritten by as option`
- `submit without object and locale strings`
- `two form for with namespace`
