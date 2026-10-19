---
title: "integration-test-answers-assert-select"
status: ready
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

`assertion-burndown-actionpack-residue` left three actiondispatch rows in `dispatch/debug_exceptions_test.rb` (kind `select`): "displays request and response info when a RoutingError occurs" (`vendor/rails/v8.0.2/actionpack/test/dispatch/debug_exceptions_test.rb:195-202`, two `assert_select "h2", …`), "rescue with text error for xhr request" (`:258-259`, `assert_select "pre", { count: 0 }, body`) and "display backtrace when error type is SyntaxError" (`:719-728`, nested `assert_select "#Application-Trace-0" do assert_select "code", … end`).

The port (`packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts:232-238,296-305,848-857`) asserts with `assertMatch` on the body instead, because `t.assertSelect` is not a function on the `DebugExceptionsTest` IntegrationTest instance: calling it raises `TypeError: tc.assertSelect is not a function`. Rails' `ActionDispatch::IntegrationTest` gets `assert_select` from `Rails::Dom::Testing::Assertions` through `ActionDispatch::Assertions` (`action_dispatch/testing/assertions.rb`). The other `assertSelect` calls in that file sit in skipped tests.

## Acceptance criteria

- `ActionDispatch::IntegrationTest` instances answer `assertSelect` (the DOM-testing selector assertions Rails includes), reading `document_root_element` from the integration response.
- The three tests above assert with `assertSelect` exactly as Rails does, and `pnpm parity:test --assertions --package actiondispatch` shows no `debug_exceptions_test.rb` row.
