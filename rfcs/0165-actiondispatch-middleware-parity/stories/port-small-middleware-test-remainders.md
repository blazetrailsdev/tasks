---
title: "Port the small middleware test remainders and converge their hand-rolled apps"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "middleware-stack-callbacks-and-session-store-shapes",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under `vendor/rails/v8.0.2/actionpack/test/dispatch/`:

- `middleware_stack_test.rb` (28): 3 missing — `use` with block arguments,
  `Middleware` equality, and instrumentation
- `executor_test.rb` (11): 3 missing — callbacks in a shared context, error
  reporting with `ShowExceptions`, and handled errors not reported
- `server_timing_test.rb` (5): 3 in `middleware/server-timing.test.ts`, 2
  missing (default Action Controller event durations, per-thread events)
- `assume_ssl_test.rb`, `callbacks_test.rb`: 1 each, in
  `middleware/assume-ssl.test.ts` / `middleware/callbacks.test.ts`
- `ssl_test.rb` (39): 3 skips — `StrictTransportSecurityTest` (1) and
  `SecureCookiesTest` (2)
- `host_authorization_test.rb` (41): 2 skips
- `debug_locks_test.rb` (1): missing

`ssl.test.ts:8`, `show-exceptions.test.ts` and `host-authorization.test.ts` each
build their own app; Rails uses `ActionDispatch::IntegrationTest.build_app`
(`test/abstract_unit.rb:118-176`).

## Acceptance criteria

- Every test above is ported or moved to its convention path; the five skip
  stubs are real tests.
- The three hand-rolled app builders are replaced by the harness.
- All eight files report complete.
