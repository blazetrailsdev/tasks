---
title: "template-error-constructor-takes-template-and-errinfo"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
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

`ActionView::Template::Error#initialize(template)`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/error.rb`) takes the
template and reads the cause from `$!`. trails' `TemplateError`
(`packages/actionview/src/template/error.ts:213`) takes
`{ original, template }`, and `template` is typed `Template`. So
`show_exceptions_test.rb:25-29`'s `Template::Error.new("template")` ports as
`new TemplateError({ original: e, template: "template" as never })` in
`packages/actionpack/src/action-dispatch/dispatch/show-exceptions.test.ts`
(trails#8960).

## Acceptance criteria

- The constructor is `(template, errinfo)`, using the CLAUDE.md
  "`$!` is passed explicitly" shape, and `template` accepts what Rails passes.
- The cast in `show-exceptions.test.ts` is gone.
