---
title: "port-form-helper-form-for-and-fields-for"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-label-helper-direct-tests` ported the `test_label*` tests of
`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb:192-388` into
`packages/actionview/src/template/form-helper.test.ts`, but three of them drive
`form_for` / `fields_for`, which trails has not ported
(`packages/actionview/src/helpers/form-helper.ts` has `formWith` only):

- `test_label_with_locales_and_nested_attributes` (`form_helper_test.rb:257-271`):
  `form_for(@post) { |f| f.fields_for(:comments) { |cf| concat cf.label(:body) } }`,
  exercising Translator's `[comments_attributes][0]` → `.comments` rewrite
  (`actionview/lib/action_view/helpers/tags/translator.rb:8`).
- `test_label_with_locales_fallback_and_nested_attributes` (`:273-287`): same over
  `:tags`, falling back to the `helpers.label.tag.value` model key.
- `test_label_with_non_active_record_object` (`:289-299`):
  `form_for(Struct.new(:name).new("ok"), as: "person", url: "/an")`.

They are `it.skip` in form-helper.test.ts. Rails: `FormHelper#form_for`
(`actionview/lib/action_view/helpers/form_helper.rb:434-464`), `apply_form_for_options!`,
`FormHelper#fields_for` / `FormBuilder#fields_for` and `fields_for_with_nested_attributes`
(`form_helper.rb`), plus the test's `whole_form` helper
(`form_helper_test.rb`, near the end of the file).

## Acceptance criteria

- `FormHelper#form_for`, `FormHelper#fields_for` and `FormBuilder#fields_for` (with the
  nested-attributes arm) are ported from `form_helper.rb` under their Rails names.
- The three skipped label tests above are un-skipped and pass, with the `whole_form`
  helper ported in form-helper.test.ts.
