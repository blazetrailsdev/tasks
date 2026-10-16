---
title: "port-form-field-tag-and-checkable-remaining-tests"
status: ready
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The bundle PR for `port-form-tag-helper-field-tag-methods`,
`port-form-helper-file-field-check-box-radio-button` and
`form-helper-button-and-default-form-builder` ported the source
(`packages/actionview/src/helpers/form-tag-helper.ts`, `form-helper.ts`,
`helpers/tags/{check-box,radio-button,file-field,checkable}.ts`) but, to stay
near the LOC ceiling, only a sample of the Rails tests:

- `vendor/rails/v8.0.2/actionview/test/template/form_tag_helper_test.rb`: ported
  `test_checkbox_tag`, `test_hidden_field_tag`, `test_radio_button_tag`,
  `test_select_tag`, `test_text_field_tag`, `test_button_tag`,
  `test_number_field_tag`. Still unported: the other `checkbox_tag_*`,
  `file_field_tag*`, `password_field_tag`, `select_tag_*`, `textarea_tag_*`,
  `text_field_tag_*`, `button_tag_*`, `image_submit_tag_*`, the
  color/search/telephone/date/time/datetime/month/week/url/email/range field-tag
  tests, `test_field_set_tag_in_erb`, the `*_options_symbolize_keys_side_effects`
  tests and `test_multiple_field_tags_with_same_options`.
- `vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb`: ported
  `file_field_has_no_size`, `file_field_with_multiple_behavior`, the first five
  `checkbox_*` tests, `radio_button`, `form_for_with_file_field_generate_multipart`,
  `button_with_method_name`, `button_with_get_formmethod_attribute`. Still
  unported: the remaining `file_field_*`, `checkbox_*` / `check_box_*`,
  `radio_button_*`, `button_with_*` tests and `test_default_form_builder`
  (needs the `LabelledFormBuilder` test class).

## Acceptance criteria

- The listed tests are ported at their Rails names, in Rails order.
