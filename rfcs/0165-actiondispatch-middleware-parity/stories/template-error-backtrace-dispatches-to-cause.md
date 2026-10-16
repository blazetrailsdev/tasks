---
title: "template-error-backtrace-dispatches-to-cause"
status: done
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8981
claim: "2026-10-16T15:44:52Z"
assignee: "template-error-backtrace-dispatches-to-cause"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Error#backtrace` / `#backtrace_locations`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/error.rb:180-186`) are
`@cause.backtrace` / `@cause.backtrace_locations`, which dispatch to
`ActiveSupport::SyntaxErrorProxy#backtrace` when the cause is wrapped
(`activesupport/lib/active_support/syntax_error_proxy.rb:11-13,34-45`). A JS
`Error` has no `backtrace` method, so `packages/actionview/src/template/error.ts`
branches on `instanceof SyntaxErrorProxy` and otherwise calls ruby-compat
`excBacktrace` / `excBacktraceLocations` (receipted `@inventedArm if`).

## Acceptance criteria

- ruby-compat's `excBacktrace` / `excBacktraceLocations` (or a dispatching
  equivalent) answer an exception's own `backtrace` / `backtraceLocations`
  override, so `Template::Error#backtrace` is one call on `cause`.
- The `instanceof` arms and their `@inventedArm` receipts are gone.
