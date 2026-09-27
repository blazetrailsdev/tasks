---
title: "port-form-helper-label"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: ["port-form-helper-tags-text-field-family"]
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

`FormBuilder#label` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:2404-2406`)
delegates to `FormHelper#label` (`:1152-1154`), which renders
`Tags::Label` (`helpers/tags/label.rb`, with its nested `LabelBuilder` and
`Tags::Translator`, `helpers/tags/translator.rb`). None of it is ported;
`packages/actionview/src/helpers/form-helper.ts` has `form_with` and the
`FormBuilder` constructor only. `FormTagHelper#label_tag`
(`form_tag_helper.rb:281-289`) is the no-object sibling. Depends on `Tags::Base`
(see `port-form-helper-tags-text-field-family`).

The scaffold `_form` template
(`railties/lib/rails/generators/erb/scaffold/templates/_form.html.erb.tt`) uses
`form.label`, so `scaffold-views-diverge-from-rails-erb-templates` needs this.

## Acceptance criteria

- `Tags::Label`, `Tags::Label::LabelBuilder`, `Tags::Translator`,
  `FormHelper#label`, `FormBuilder#label`, `FormTagHelper#label_tag` exist at their
  Rails names with Rails' control flow and I18n lookups (`helpers.label.<object>.<method>`).
- `form_with_test.rb` `test_form_with_only_url_on_create` / `_update` (`:438-464`) and
  `test_form_with_label_passes_translation_to_block_version` …
  `test_form_with_label_accesses_object_through_label_tag_builder` (`:1006-1052`) are ported.
