---
title: "Port form_with_test.rb remaining tests (remainder, part 1 of 3)"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 370
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-form-with-test-remaining-tests` ported the `fields` family and the
url/model-option tests of
`vendor/rails/v8.0.2/actionview/test/template/form_helper/form_with_test.rb`
into `packages/actionview/src/template/form-helper/form-with.test.ts`. It
stopped at the PR LOC ceiling. The file's local `Post` / `Comment` models and
the `wholeForm` helper (with `multipart`) are in place. The `Routes` set
carries the `admin` namespace. Most of the remaining tests need more
`@post` setup from Rails' `setup` block (`form_with_test.rb:195-309`):
`errors`, `author_name`, `written_on`, `tags`, `PostDelegator`, `Car`, and the
`label` / `placeholder` locales.

Rails tests still missing (`form_with_test.rb:<line>`):

- `165:test_form_with_with_block_and_method_in_erb`
- `175:test_form_with_with_block_in_erb_and_local_true`
- `349:test_form_with`
- `378:test_form_with_with_persisted_to_model`
- `388:test_form_with_with_new_record_to_model`
- `398:test_form_with_button_yields_translation`
- `410:test_form_with_not_outputting_ids`
- `506:test_form_with_doesnt_call_private_or_protected_properties_on_form_object_skipping_value`
- `525:test_form_with_with_collection_select`
- `542:test_form_with_with_collection_radio_buttons`
- `560:test_form_with_with_collection_radio_buttons_with_custom_builder_block`
- `584:test_form_with_with_collection_radio_buttons_with_custom_builder_block_does_not_leak_the_template`
- `611:test_form_with_with_index_and_with_collection_radio_buttons`
- `630:test_form_with_with_collection_checkboxes`
- `651:test_form_with_with_collection_checkboxes_with_custom_builder_block`
- `678:test_form_with_with_collection_checkboxes_with_custom_builder_block_does_not_leak_the_template`
- `709:test_form_with_index_and_with_collection_checkboxes`
- `727:test_form_with_with_file_field_generate_multipart`
- `739:test_fields_with_file_field_generate_multipart`
- `753:test_form_with_with_format`
- `765:test_form_with_with_format_and_url`
- `777:test_form_with_with_model_using_relative_model_naming`
- `793:test_form_with_with_symbol_scope`
- `814:test_form_with_with_method_as_part_of_html_options`
- `831:test_form_with_with_method`
- `862:test_form_with_enables_remote_by_default`
- `879:test_form_is_not_remote_by_default_if_form_with_generates_remote_forms_is_false`
- `953:test_form_with_without_object`
- `970:test_form_with_with_index`
- `989:test_form_with_with_nil_index_option_override`

## Acceptance criteria

- Every test in the list above has a counterpart in `form-with.test.ts` at the Rails name
  (`erb` becomes `tse` per docs/ruby-ts-conventions.md).
- A test that cannot run is `it.skip` with a `BLOCKED: <story-id>` or
  `PERMANENT-SKIP:` line.
