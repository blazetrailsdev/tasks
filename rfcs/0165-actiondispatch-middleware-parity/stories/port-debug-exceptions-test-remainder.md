---
title: "Port debug_exceptions_test.rb's 18 missing tests"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "exceptions-debug-view-and-remote-ip-missing-members",
    "debug-exceptions-logger-follows-request-logger-chain",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/debug_exceptions_test.rb` is one
class, `DebugExceptionsTest < ActionDispatch::IntegrationTest` (`:5-910`), with
42 tests; 18 are missing from `dispatch/debug-exceptions.test.ts`: the routes
table on a `RoutingError`, rescue suggestions, filtered parameters, the
original exception behind a `Template::Error`, the cause when it maps to
`rescue_responses`, the env backtrace cleaner, logging when all lines are
silenced and for routing / invalid-MIME errors, backtraces for missing
templates and wrapped `SyntaxError`s, the source view for user code and nested
exceptions, bad interceptors, actionable-error buttons, malformed query
parameters (HTML and XHR), and UTF-8 in template errors.

Several render through `DebugView` and the rescue templates, which RFC 0100's
`debug-view-rescue-templates-are-never-shipped` ships.

## Acceptance criteria

- The 18 tests are ported in Rails order.
- The file reports 42/42.
