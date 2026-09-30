---
title: "port-form-builder-submit-and-submit-tag"
status: done
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8247
claim: "2026-09-29T18:37:12Z"
assignee: "port-form-builder-submit-and-submit-tag"
blocked-by: null
closed-reason: null
---

## Context

`port-form-helper-form-with` ported `form_with`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:756`), its
private helpers, the form-construction half of `FormTagHelper` and the
`FormBuilder` constructor into `packages/actionview/src/helpers/form-helper.ts` /
`form-tag-helper.ts`. It stopped short of the submit button to stay under the
PR LOC ceiling. Still unported:

- `FormBuilder#submit` (`form_helper.rb:2589-2593`) and its private
  `submit_default_value` (`:2681-2702`) — the I18n lookup over
  `helpers.submit.<i18n_key|object_name>.<create|update|submit>`, `helpers.submit.<key>`,
  then `"#{key.to_s.humanize} #{model}"`. Symbol keys spell as `":helpers.submit…"`
  strings (see activemodel `error.ts` for the `I18n.t(defaults.shift(), { default })` idiom).
  Note `object ?` must treat `false` as falsy: `form_with` without `model:` hands
  the builder `object = false`.
- `FormTagHelper#submit_tag` (`form_tag_helper.rb:527-532`) and private
  `set_default_disable_with` (`:1060-1073`), which reads
  `ActionView::Base.automatically_disable_submit_tag` (`ActionView.Base` at call time,
  `packages/actionview/src/namespaces.ts`). `data` sub-keys stay snake (`disable_with`)
  because they are rendered.
- `FormBuilder#id` (`form_helper.rb:1757-1759`), `#to_model` (`:1716`),
  `#to_partial_path` / `._to_partial_path` (`:1708-1714`).

## Acceptance criteria

- The methods above exist at their Rails names in `form-helper.ts` / `form-tag-helper.ts`
  with Rails' control flow.
- `form_with_test.rb`'s `test_submit_with_object_as_new_record_and_locale_strings`,
  `…_as_existing_record_…`, `test_submit_without_object_and_locale_strings`,
  `…_overwritten_by_scope_option`, `…_which_is_namespaced` (`:1102-1175`) are ported
  to `packages/actionview/src/template/form-helper/form-with.test.ts` under
  `FormWithActsLikeFormForTest`, exercising the `model:` → `polymorphic_path` url arm.
