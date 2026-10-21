---
title: "Port form_with_test.rb remaining tests (remainder)"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 1100
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
- `1054:test_form_with_label_error_wrapping`
- `1070:test_form_with_label_error_wrapping_without_conventional_instance_variable`
- `1088:test_form_with_label_error_wrapping_block_and_non_block_versions`
- `1190:test_fields_with_attributes_not_on_model_deep_nested`
- `1210:test_nested_fields`
- `1225:test_deep_nested_fields`
- `1245:test_nested_fields_with_nested_collections`
- `1261:test_nested_fields_with_index_and_parent_fields`
- `1277:test_form_with_with_index_and_nested_fields`
- `1291:test_nested_fields_with_index_on_both`
- `1305:test_nested_fields_with_auto_index`
- `1319:test_nested_fields_with_index_radio_button`
- `1333:test_nested_fields_with_auto_index_on_both`
- `1347:test_nested_fields_with_index_and_auto_index`
- `1373:test_nested_fields_with_a_new_record_on_a_nested_attributes_one_to_one_association`
- `1391:test_nested_fields_with_explicitly_passed_object_on_a_nested_attributes_one_to_one_association`
- `1400:test_nested_fields_with_an_existing_record_on_a_nested_attributes_one_to_one_association`
- `1419:test_nested_fields_with_an_existing_record_on_a_nested_attributes_one_to_one_association_using_erb_and_inline_block`
- `1438:test_nested_fields_with_an_existing_record_on_a_nested_attributes_one_to_one_association_with_disabled_hidden_id`
- `1456:test_nested_fields_with_an_existing_record_on_a_nested_attributes_one_to_one_association_with_disabled_hidden_id_inherited`
- `1474:test_nested_fields_with_an_existing_record_on_a_nested_attributes_one_to_one_association_with_disabled_hidden_id_override`
- `1493:test_nested_fields_with_existing_records_on_a_nested_attributes_one_to_one_association_with_explicit_hidden_field_placement`
- `1513:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association`
- `1536:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association_with_disabled_hidden_id`
- `1563:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association_with_disabled_hidden_id_inherited`
- `1589:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association_with_disabled_hidden_id_override`
- `1616:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association_using_erb_and_inline_block`
- `1639:test_nested_fields_with_existing_records_on_a_nested_attributes_collection_association_with_explicit_hidden_field_placement`
- `1663:test_nested_fields_with_new_records_on_a_nested_attributes_collection_association`
- `1684:test_nested_fields_with_existing_and_new_records_on_a_nested_attributes_collection_association`
- `1706:test_nested_fields_with_an_empty_supplied_attributes_collection`
- `1721:test_nested_fields_with_existing_records_on_a_supplied_nested_attributes_collection`
- `1742:test_nested_fields_arel_like`
- `1763:test_nested_fields_label_translation_with_more_than_10_records`
- `1782:test_nested_fields_with_existing_records_on_a_supplied_nested_attributes_collection_different_from_record_one`
- `1804:test_nested_fields_on_a_nested_attributes_collection_association_yields_only_builder`
- `1827:test_nested_fields_with_child_index_option_override_on_a_nested_attributes_collection_association`
- `1844:test_nested_fields_with_child_index_as_lambda_option_override_on_a_nested_attributes_collection_association`
- `1867:test_nested_fields_with_child_index_option_override_on_a_nested_attributes_collection_association_with_proxy`
- `1884:test_nested_fields_index_method_with_existing_records_on_a_nested_attributes_collection_association`
- `1898:test_nested_fields_index_method_with_existing_and_new_records_on_a_nested_attributes_collection_association`
- `1912:test_nested_fields_index_method_with_existing_records_on_a_supplied_nested_attributes_collection`
- `1924:test_nested_fields_index_method_with_child_index_option_override_on_a_nested_attributes_collection_association`
- `1934:test_nested_fields_uses_unique_indices_for_different_collection_associations`
- `1980:test_nested_fields_with_hash_like_model`
- `1996:test_nested_fields_with_hash_with_indifferent_access_like_model`
- `2144:test_form_with_and_fields`
- `2164:test_form_with_and_fields_with_object`
- `2183:test_form_with_and_fields_with_non_nested_association_and_without_object`
- `2208:test_form_with_with_labelled_builder`
- `2224:test_default_form_builder`
- `2245:test_lazy_loading_default_form_builder`
- `2262:test_form_builder_override`
- `2274:test_lazy_loading_form_builder_override`
- `2286:test_fields_with_labelled_builder`
- `2301:test_form_with_with_labelled_builder_with_nested_fields_without_options_hash`
- `2314:test_form_with_with_labelled_builder_with_nested_fields_with_options_hash`
- `2327:test_form_with_with_labelled_builder_path`
- `2340:test_form_with_with_labelled_builder_with_nested_fields_with_custom_builder`

## Acceptance criteria

- Every test above has a counterpart in `form-with.test.ts` at the Rails name
  (`erb` becomes `tse` per docs/ruby-ts-conventions.md).
- A test that cannot run is `it.skip` with a `BLOCKED: <story-id>` or
  `PERMANENT-SKIP:` line.
- `pnpm parity:test --package actionview` shows 0 missing for `form_with_test.rb`.
