---
title: "port-form-helper-tags-text-field-family"
status: ready
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-form-helper-form-with` ported `form_with` and the `FormBuilder`
constructor (`packages/actionview/src/helpers/form-helper.ts`) but no field
helpers. Still unported, all in `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/`:

- `Tags::Base` (`tags/base.rb`, 138 lines: `value`, `value_before_type_cast`,
  `add_default_name_and_id`, `tag_name`, `tag_id`, `name_and_id_index`, …),
  `Tags::Placeholderable` (`tags/placeholderable.rb`), `Tags::Translator`
  (`tags/translator.rb`), `Tags::TextField` (`tags/text_field.rb`) and its
  one-line subclasses (`password_field.rb`, `email_field.rb`, `url_field.rb`,
  `tel_field.rb`, `search_field.rb`, `number_field.rb`, `range_field.rb`,
  `color_field.rb`, date/time fields), `Tags::TextArea`, `Tags::HiddenField`.
  `tags/base.rb` is in `scripts/parity/unported-files/actionview.ts`; retire it on port.
- `FormTagHelper#field_id` / `#field_name` (`form_tag_helper.rb:102-150`), which
  `Tags::Base#tag_id` / `#tag_name` call on the template.
- `FormHelper#text_field` … `#range_field` (`form_helper.rb:1176-1589`).
- On `FormBuilder`: `class_attribute :field_helpers` (`:1685-1693`), the
  `CodeGenerator.batch` field methods (`:2023-2033`) plus `alias text_area textarea`,
  `field_id` / `field_name` (`:1777-1810`), `objectify_options` (`:2675-2679`),
  `@nested_child_index` (initialize `:1721`, dropped because lint rejects a
  write-only private member until `nested_child_index` `:2750` lands), and
  `mattr_accessor :multiple_file_field_include_hidden` (`:484`).

## Acceptance criteria

- Each method above exists at its Rails name in the file mirroring its `.rb`.
- `form_with_test.rb` cases that need only text-type fields are ported:
  `test_form_with_general_attributes` (`:466`), `test_form_with_attribute_not_on_model`
  (`:494`), `test_form_with_skip_enforcing_utf8_true/false`, `test_form_with_default_enforce_utf8_*`
  (`:901-951`), `test_form_with_with_search_field` (`:848`).
