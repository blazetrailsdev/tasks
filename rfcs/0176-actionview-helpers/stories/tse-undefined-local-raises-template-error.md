---
title: "tse-undefined-local-raises-template-error"
status: draft
updated: 2026-10-20
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

A TSE template that reads an undefined local (`<%= doesnt_exist %>`,
`<%= partial_name_local_variable %>`) renders without raising. Rails raises
`NameError` inside the compiled method, which `Template#handle_render_error`
wraps in `ActionView::Template::Error`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:560-578`). Parked
as `it.skip` in `packages/actionview/src/template/render.test.ts`:
`render partial with errors` (`render_test.rb:355`),
`render template with errors` (`:373`),
`render sub template with errors` (`:382`),
`undefined method error references named class` (`:390`),
`render partial without object or collection does not generate partial name local variable` (`:533`).

## Acceptance criteria

- [ ] Reading an undeclared name in a TSE template raises a `ReferenceError` that surfaces as `ActionView::Template::Error` with the line number and `sub_template_message` Rails reports.
- [ ] The five tests above are un-skipped and pass.
