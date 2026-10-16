---
title: "template-error-wraps-syntax-error-in-proxy"
status: done
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8966
claim: "2026-10-16T00:52:08Z"
assignee: "debug-view-extends-action-view-base-and-renders-rescue-templates"
blocked-by: null
closed-reason: null
---

## Context

`Template::Error#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/error.rb:176-178`)
wraps a `SyntaxError` cause in `ActiveSupport::SyntaxErrorProxy`
(`activesupport/lib/active_support/syntax_error_proxy.rb`). trails has no
`SyntaxErrorProxy`, so `TemplateError`'s constructor
(`packages/actionview/src/template/error.ts`) omits the arm. Surfaced on trails#8960.

## Acceptance criteria

- `SyntaxErrorProxy` is ported in activesupport.
- `TemplateError`'s constructor wraps a `SyntaxError` cause as `error.rb:176-178` does.
