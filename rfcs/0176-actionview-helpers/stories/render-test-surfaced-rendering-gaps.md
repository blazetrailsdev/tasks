---
title: "render-test-surfaced-rendering-gaps"
status: done
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - port-builder-template-handler
deps-rfc: []
est-loc: 300
priority: 4
pr: trails#9272
claim: "2026-10-23T02:06:05Z"
assignee: "render-test-surfaced-rendering-gaps"
blocked-by: null
closed-reason: null
---

## Context

Rendering gaps surfaced while porting the rest of
`vendor/rails/v8.0.2/actionview/test/template/render_test.rb` into
`packages/actionview/src/template/render.test.ts`. Each is parked there as
`it.skip` naming this story:

- `render partial use last prepended format for partials with the same names` (`render_test.rb:115`): a partial rendered with `formats: :json` leaves `:json` ahead of `:html` for the next partial; trails renders "JSON" where Rails renders "HTML".
- `render template with handlers` (`:138`): there is no `:builder` template handler (`action_view/template/handlers/builder.rb`).
- `render template with syntax error` (`:212`): the fixture `test/syntax_error.html.erb` (`<%= foo(\n  1,\n  2,\n%>`) is a Ruby syntax error, but the TSE pipeline accepts it (and even `foo(1, 2,,`) and raises `foo is not a function` at run time instead of a `Template::Error` matching /syntax/ with `annotated_source_code[0]` `"1:    <%= foo("`.
- `without compiled method container is deprecated` (`:458`): `Base#compiled_method_container` raises `NotImplementedError` (`action_view/base.rb:271-278`), but trails wraps it in `Template::Error`.
- `render layout with a nested render layout call using block with render partial` (`:693`) and `cache fragments inside render layout call with block` (`:812`): a `render layout:` block whose body awaits a nested `render`/`cache` yields a Promise to `capture`, "no implicit conversion of Promise into String" / an empty capture.
- `render with nested layout` (`:738`): `content_for :column do ... end` captures the outer `render layout:` block's content instead of its own.

## Acceptance criteria

- [ ] Each test listed above is un-skipped and passes with the Rails assertions.
