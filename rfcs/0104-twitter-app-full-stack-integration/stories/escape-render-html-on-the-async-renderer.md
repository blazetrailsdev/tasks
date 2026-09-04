---
title: "escape-render-html-on-the-async-renderer"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Template::HTML#to_str` is `ERB::Util.h(@string)`
(`vendor/rails/actionview/lib/action_view/template/html.rb:20-22`), so
`render html:` HTML-escapes an unsafe string and passes an `html_safe` one
through. `actionpack/test/controller/new_base/render_html_test.rb:168-178`
asserts both halves: `render html: "<p>hello world</p>"` renders
`&lt;p&gt;hello world&lt;/p&gt;`, and the `html_safe` form renders verbatim.

`Base#render`'s synchronous `html:` arm was fixed to call `htmlEscape` in
PR 7439. The asynchronous renderer still has the original bug:
`HtmlTemplate` in `packages/actionview/src/renderer/template-renderer.ts:206-216`
is constructed with `String(options.html ?? "")`
(`determineTemplate`, `:38-40`) and its `render` returns that content
unescaped. So a controller's `render html: "<script>"` emits the raw markup —
an escaping gap, not only a fidelity one.

`RenderOptions.html` was widened from `string` to `unknown` in that PR to match
Rails' `string.to_s`, so an `html_safe` buffer already reaches this constructor
intact and the `html_safe?` check has something to test.

## Acceptance criteria

- `HtmlTemplate` escapes through the `ERB::Util.h` analogue
  (`htmlEscape` in `activesupport/src/core-ext/tse/util.ts`) rather than
  `String(...)`, so an unsafe string is escaped and an `html_safe` one is not.
- A cover asserts both halves against `render_html_test.rb:168-178`'s strings.
- `Base#render`'s synchronous arm and the async renderer agree.
