---
title: "port-label-helper-direct-tests"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8257 (`port-form-helper-label`) ported `Tags::Label`, `Tags::Label::LabelBuilder`,
`FormHelper#label`, `FormBuilder#label` and `FormTagHelper#label_tag`, but it covered them
only through five `form_with_test.rb` tests. The direct Rails tests for these helpers are
still unported:

- `vendor/rails/v8.0.2/actionview/test/template/form_tag_helper_test.rb:618-665`: the
  `test_label_tag_*` tests (without text, with symbol, with text, class string, id
  sanitized, the block variants). trails has no `template/form-tag-helper.test.ts`, so this
  story creates it and enrolls it in test:compare.
- `vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb:192-388`: the 26
  `test_label*` tests (I18n `helpers.label.<object>.<method>` lookups, `value:`, `for:`,
  `namespace:`, `index:`, `to_model` / overridden `model_name`). They belong in
  `packages/actionview/src/template/form-helper.test.ts`.

Implementation: `packages/actionview/src/helpers/tags/label.ts`,
`packages/actionview/src/helpers/form-tag-helper.ts` (`labelTag`, `sanitizeToId`),
`packages/actionview/src/helpers/form-helper.ts` (`label`, `FormBuilder#label`).

## Acceptance criteria

- Every `test_label_tag_*` in `form_tag_helper_test.rb:618-665` is ported under its Rails
  name, in a new `form-tag-helper.test.ts` enrolled in test:compare.
- Every `test_label*` in `form_helper_test.rb:192-388` is ported under its Rails name.
- Any failures they expose are fixed in the port, not in the tests.
