---
title: "select-tag-treats-safe-buffer-choices-as-string"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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
closed-reason: null
---

## Context

`Tags::Select` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/select.rb:13-14,39-41`)
and `options_for_select`'s `return container if String === container`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_options_helper.rb:358`)
treat a `SafeBuffer` as the `String` it is. In trails,
`packages/actionview/src/helpers/form-options-helper.ts` `optionsForSelect`
tests only `typeof container === "string"`, and `Select#isGroupedChoices`
(`packages/actionview/src/helpers/tags/select.ts:64-70`) calls ruby-compat
`first` on the choices, which raises `NoMethodError: undefined method 'first'
for an instance of ActiveSupport::SafeBuffer` (AS `String#first` answers the
first character). A `raw(...)` choices string or a block's captured buffer
therefore fails. Separately, `f.select(:category) { }` renders
`<option selected="selected" value=""></option>` where Rails renders an empty
select.

Parked as `it.skip` under `// BLOCKED: select-tag-treats-safe-buffer-choices-as-string`
in `packages/actionview/src/template/form-options-helper.test.ts`:
`select under fields for with string and given prompt`,
`select under fields for with block`,
`select under fields for with block without options`
(`form_options_helper_test.rb:670-708`).

## Acceptance criteria

- A SafeBuffer choices value takes the String arm in both places.
- The three tests are un-skipped and pass.
