---
title: "port-form-helper-file-field-check-box-radio-button"
status: claimed
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-10-15T23:54:17Z"
assignee: "port-form-helper-file-field-check-box-radio-button"
blocked-by: null
closed-reason: null
---

## Context

`FormHelper#file_field`, `#check_box` and `#radio_button`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb`) and
their tag classes `Tags::FileField`, `Tags::CheckBox`, `Tags::RadioButton`
(`actionview/lib/action_view/helpers/tags/`) have no trails port:
`packages/actionview/src/helpers/form-helper.ts` defines none of them, so the
live `FormHelper` Module (trails#8940) cannot install them, and `FormBuilder`'s
generated field helpers lack them too.

## Acceptance criteria

- `fileField`, `checkBox`, `radioButton` ported in `form-helper.ts` and listed
  in the `FormHelper` Module; the three Tags classes under `helpers/tags/`.
- The matching `form_helper_test.rb` cases are ported.
