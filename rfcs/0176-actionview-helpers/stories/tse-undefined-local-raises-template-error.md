---
title: "tse-undefined-local-raises-template-error"
status: claimed
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-10-21T00:47:23Z"
assignee: "tse-undefined-local-raises-template-error"
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
`render partial without object or collection does not generate partial name local variable` (`:533`),
`render runtime error` (`:218`), `render location conditional append` (`:231`) and
`render location conditional append 2` (`:244`), whose fixtures
(`test/runtime_error.html.erb`, `test/unparseable_runtime_error*.html.erb`) call the
undefined `method_that_does_not_exist` and then read the spot through
`ActionDispatch::ExceptionWrapper::SourceMapLocation#spot`, and
`render error indentation` (`:364`), which is ported in the test with a
`throw` expression but finds `TemplateError#lineNumber` nil for a
`FixtureResolver` template (Rails reports `"11"`).

## Acceptance criteria

- [ ] Reading an undeclared name in a TSE template raises a `ReferenceError` that surfaces as `ActionView::Template::Error` with the line number and `sub_template_message` Rails reports.
- [ ] The five tests above are un-skipped and pass.
