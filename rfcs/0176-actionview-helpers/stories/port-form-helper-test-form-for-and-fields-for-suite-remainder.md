---
title: "port-form-helper-test-form-for-and-fields-for-suite-remainder"
status: claimed
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-19T18:34:49Z"
assignee: "nokogiri-xpath-evaluator-behind-searchable-css"
blocked-by: null
closed-reason: null
---

## Context

`port-form-helper-test-form-for-and-fields-for-suite` ported the first batch of the
`form_for` / `fields_for` suite of
`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb:1599-4140` into
`packages/actionview/src/template/form-helper.test.ts`: requires-block/arguments,
false url/action, text_area alias, every `form_for_field_id*` / `form_for_field_name*`
test (`:1734-1964`), `test_nested_fields_for`, `_field_id`, `_field_id_with_index_override`,
`test_deep_nested_fields_for`, `_with_index_and_parent_fields`,
`test_form_for_with_index_and_nested_fields_for`, and the
one-to-one / collection nested-attributes cases at `:3020-3064` and `:3160-3181`. The
`Post` / `Comment` / `Author` fakes there now carry `author`, `name`, `save`,
`relevances` and the `*_attributes=` writers of `test/lib/controller/fake_models.rb`.
It also ported `test_fields_with_attributes_not_on_model`
(`form_helper/form_with_test.rb:1176`) for `FormBuilder#fields`.

Left out for the LOC ceiling, all using only already-ported helpers
(`text_field`, `hidden_field`, `label`, `field_id`/`field_name`):

- `form_helper_test.rb:2891` `test_nested_fields_for_with_nested_collections`,
  `:2939` `test_nested_fields_for_with_index_on_both`,
  `:2953` `_with_auto_index`, `:2981` `_with_auto_index_on_both`,
  `:2995` `_with_index_and_auto_index`.
- `:3066` and `:3085-3159`: the one-to-one `using_erb_and_inline_block`,
  `with_disabled_hidden_id` (plain / inherited / override) and
  `explicit_hidden_field_placement` cases.
- `:3183-3352`: the collection-association `with_disabled_hidden_id` trio,
  `using_erb_and_inline_block`, `explicit_hidden_field_placement`, `new_records`,
  `existing_and_new_records`.
- `:3353-3672`: supplied collections, arel-like, child_index (incl. lambda / proxy),
  `index` method, unique indices, hash-like models (need `CommentRelevance`,
  `TagRelevance`, `HashBackedAuthor` fakes).
- `:3673-3860`: `test_fields_for*`, `test_form_for_and_fields_for*` (several need
  `checkbox` — `port-form-helper-tags-remaining-field-types`).
- `:3876-4140`: labelled builder, default/lazy builder, url/record options, cpk.

Tests needing `checkbox`, `radio_button`, `file_field`, `submit`/`button` or
`collection_*` wait on `port-form-helper-tags-remaining-field-types`; this includes
every direct `FormHelper#fields` test (`form_with_test.rb:2012-2110`).

## Acceptance criteria

- Each listed test whose helpers are ported is ported under its Rails name in
  `form-helper.test.ts` (or `form-helper/form-with.test.ts` for the `fields` ones), passing.
- Any divergence the tests surface is fixed in `form-helper.ts`, not in the test.
