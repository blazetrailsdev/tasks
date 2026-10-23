---
title: "Port form_with_test.rb remaining tests (remainder, part 3 of 3)"
status: done
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: ["port-form-with-test-remaining-tests-remainder-2"]
deps-rfc: []
est-loc: 360
priority: null
pr: trails#9261
claim: "2026-10-22T23:20:48Z"
assignee: "port-form-with-test-remaining-tests-remainder-3"
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

This is part 3 of 3, split from `port-form-with-test-remaining-tests-remainder` (part 1), which owns the shared setup. Rails tests this part owns (`form_with_test.rb:<line>`):

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

- Every test in the list above has a counterpart in `form-with.test.ts` at the Rails name
  (`erb` becomes `tse` per docs/ruby-ts-conventions.md).
- A test that cannot run is `it.skip` with a `BLOCKED: <story-id>` or
  `PERMANENT-SKIP:` line.
- `pnpm parity:test --package actionview` shows 0 missing for `form_with_test.rb`.
