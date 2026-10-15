---
title: "FormHelper: FormBuilder#button and default_form_builder"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FormHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb`) still lacks `button` (FormBuilder#button), and the `default_form_builder` / `default_form_builder=` mattr pair, per parity on origin/main (entries removed). Everything else missing on that row is either FormTagHelper's include (separate story) or checkbox/radio/file (`port-form-helper-file-field-check-box-radio-button`).

## Acceptance criteria

- [ ] `FormBuilder#button` and `default_form_builder` / `=` ported per Rails, with `form_helper_test.rb` button / default-form-builder cases.
- [ ] parity `form_helper.rb` row: 0 missing once the sibling stories land.
