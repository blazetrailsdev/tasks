---
title: "actiontext engine reaches SystemTestHelper the way engine.rb's require does"
status: ready
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb:77-82` requires `action_text/system_test_helper` and includes it into `ActionDispatch::SystemTestCase` in an `on_load(:action_dispatch_system_test_case)` hook. trails (`packages/actiontext/lib/engine.ts`, initializer `action_text.system_test_helper`) loads `@blazetrails/actiontext/system-test-helper` with an awaited bare-specifier `import()` instead of a static import, because a static import of the test-only helper from `engine.ts` reds the `server-path-closure` check (RFC 0223). Landed in trails#10151.

## Acceptance criteria

- The helper is reached the way the other test-only modules converged under this RFC (`server-path-*` stories), so `engine.ts` reads like `engine.rb`'s `require` + `include`.
- `server-path-closure` stays green; actiontext system tests still pass.
