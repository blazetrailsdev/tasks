---
title: "port-form-helper-tags-remaining-field-types"
status: closed
updated: 2026-09-29
rfc: "0140-actionview-rendering-core"
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
closed-reason: "folded into trails#8249 after the LOC ceiling was waived"
---

## Context

`port-form-helper-tags-text-field-family` shipped `Tags::Base`, `Tags::TextField`,
`Tags::SearchField`, `FormTagHelper#field_id` / `#field_name`, `FormHelper#text_field` /
`#search_field`, and on `FormBuilder` the `field_helpers` class_attribute, the
`CodeGenerator.batch` field methods, `field_id` / `field_name` and `objectify_options`
(`packages/actionview/src/helpers/{form-helper,form-tag-helper}.ts`,
`packages/actionview/src/helpers/tags/{base,text-field,search-field}.ts`). It was cut to fit the
LOC ceiling. Still unported, all in `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/`:

- `Tags::Placeholderable` (`tags/placeholderable.rb`), included by `TextField` and `TextArea`,
  and `Tags::Translator` (`tags/translator.rb`). `TextField` currently extends `Base` directly.
  A class-mixin factory (`class TextField extends Placeholderable(Base)`, return type annotated
  `: T` to avoid TS4094) mirrors the ancestry.
- `Tags::TextArea`, `HiddenField`, `PasswordField`, `EmailField`, `UrlField`, `TelField`,
  `NumberField` (`Range#min`/`#max` via ruby-compat `Range`), `RangeField`, `ColorField`.
- `Tags::DatetimeField` and its subclasses (`date_field.rb`, `time_field.rb`,
  `datetime_local_field.rb`, `month_field.rb`, `week_field.rb`).
- `Tags::Base#add_default_name_and_id_for_value` / `#sanitized_value` (`tags/base.rb:84-95,125-127`).
- `ActiveModelInstanceTag` (`active_model_helper.rb:11-50`), which `Tags::Base` includes:
  `object` (to_model), `content_tag` / `tag` error wrapping through `Base.field_error_proc`.
  `parity:api:extra` reports `tags/base.ts object inlined-from helpers/active_model_helper.rb`.
- `FormHelper#password_field`, `#hidden_field`, `#textarea` (+ `alias_method :text_area`),
  `#color_field`, `#telephone_field` (+ `alias phone_field`), `#url_field`, `#email_field`,
  `#number_field`, `#range_field`, the date/time field helpers (`form_helper.rb:1197-1589`).
- `FormBuilder#hidden_field` / `#emitted_hidden_id?` (`form_helper.rb:2518-2521,2670-2672`) and
  `alias_method :text_area, :textarea` (`:2034`). The batch-generated builder methods for the
  helpers above already exist and forward to `@template.<selector>`; they raise until the
  template helper lands.
- `mattr_accessor :multiple_file_field_include_hidden` (`form_helper.rb:484`).

## Acceptance criteria

- Each class/method above exists at its Rails name in the file mirroring its `.rb`.
- The `FormBuilder` interface in `form-helper.ts` declares every batch-generated method whose
  template helper is ported.
- `form_with_test.rb` cases using those fields are ported, e.g. `test_form_with_enables_remote_by_default`
  and `test_form_with_without_object` (textarea), and placeholder cases.
