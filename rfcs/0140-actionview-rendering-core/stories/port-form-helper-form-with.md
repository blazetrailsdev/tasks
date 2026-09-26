---
title: "port-form-helper-form-with"
status: draft
updated: 2026-09-26
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
closed-reason: null
---

## Context

`ActionView::Helpers::FormHelper#form_with`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:756`) and the
`FormBuilder` field methods it yields (`label` `:2404`, `submit` `:2589`, the
`text_field` / `text_area` / `password_field` / … family generated from
`field_helpers`, class at `:1681`) are not ported. trails'
`packages/actionview/src/helpers/form-builder.ts` is a 27-line class with no
field methods, and nothing in `packages/actionview/src/helpers/` defines
`formWith`.

The scaffold generator's `_form` view
(`vendor/rails/v8.0.2/railties/lib/rails/generators/erb/scaffold/templates/_form.html.erb.tt`)
is `form_with(model:) do |form|` + `form.label` / `form.<field_type>` /
`form.submit`, so `scaffold-views-diverge-from-rails-erb-templates` cannot emit
Rails' form until this lands.

## Acceptance criteria

- `formWith({ model, scope, url, format, ...options }, (form) => ...)` is a view
  helper in `helpers/form-helper.ts`, mirroring `form_helper.rb:756` (including
  `html_options_for_form_with` and the `model:` → `polymorphic_path` url arm).
- `FormBuilder#label`, `#submit` and the `field_helpers` field methods exist,
  mirroring `form_helper.rb:1681-2600`.
- Tests mirror `actionview/test/template/form_helper/form_with_test.rb` for the
  ported arms.
