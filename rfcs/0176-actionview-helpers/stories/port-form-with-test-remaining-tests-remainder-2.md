---
title: "Port form_with_test.rb remaining tests (remainder, part 2 of 3)"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: ["port-form-with-test-remaining-tests-remainder"]
deps-rfc: []
est-loc: 370
priority: null
pr: trails#9253
claim: "2026-10-22T21:42:04Z"
assignee: "rack-middleware-accepts-any-call-responder"
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

This is part 2 of 3, split from `port-form-with-test-remaining-tests-remainder` (part 1), which owns the shared setup. Rails tests this part owns (`form_with_test.rb:<line>`):

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

## Acceptance criteria

- Every test in the list above has a counterpart in `form-with.test.ts` at the Rails name
  (`erb` becomes `tse` per docs/ruby-ts-conventions.md).
- A test that cannot run is `it.skip` with a `BLOCKED: <story-id>` or
  `PERMANENT-SKIP:` line.
