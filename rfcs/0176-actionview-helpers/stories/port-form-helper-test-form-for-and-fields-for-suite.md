---
title: "Port the form_for / fields_for / fields tests of form_helper_test.rb"
status: ready
updated: 2026-10-01
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8327 ported `FormHelper#form_for`, `#fields_for`, `#fields`, `FormBuilder#fields_for`,
`#fields` and the nested-attributes arm
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:436-478`,
`:1029-1091`, `:2289-2334`, `:2704-2748`) into
`packages/actionview/src/helpers/form-helper.ts`, but un-skipped only the three label tests
that drove them (`form_helper_test.rb:257-299`). The `form_for` / `fields_for` suite proper is
unported: about 140 tests in
`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb:1599-4140`
(`test_form_for_requires_block` through `test_form_for_with_persisted_cpk_model`), including
every `test_nested_fields_for_*` case that exercises `fields_for_with_nested_attributes`'s
`child_index`, `include_id` and hidden-`id` arms, and the `fields` cases. `FormHelper#fields`
and `FormBuilder#fields` shipped with no direct test at all.

`packages/actionview/src/template/form-helper.test.ts` already carries what the suite needs:
`formFor` (records `rendered`, as the Rails override at `form_helper_test.rb:21-23`),
`wholeForm` / `formText` / `hiddenFields` (`:4148-4180`), the `posts` routes, and the `Post` /
`Comment` / `Tag` fake models. The remaining fakes (`CommentRelevance`, `TagRelevance`,
`Author`, `Blog::Post`, `Cpk::Book`, …) are in
`vendor/rails/v8.0.2/actionview/test/lib/controller/fake_models.rb`.

Many of these tests call `checkbox`, `radio_button`, `file_field`, `submit` and the select
helpers, so they depend on `port-form-helper-tags-remaining-field-types`. The suite is larger
than one PR: ship the portion that fits the LOC ceiling (start with the tests that use only
`text_field` / `textarea` / `label` / `hidden_field`) and register the remainder as further
stories.

## Acceptance criteria

- The `form_for` / `fields_for` / `fields` tests of `form_helper_test.rb:1599-4140` whose
  field helpers are already ported are ported under their Rails names in
  `form-helper.test.ts`, passing; the rest are registered as follow-up stories naming the
  helper each waits on.
- At least one ported test drives `FormHelper#fields` and one `FormBuilder#fields`.
- Any divergence the tests surface in the #8327 port is fixed in the implementation, not in
  the test.
