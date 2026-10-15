---
title: "Port live_response_test.rb and the remaining single HTTP tests"
status: in-progress
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "response-invented-iterators-buffer-and-missing-members",
    "live-buffer-queue-is-not-a-blocking-sized-queue",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 300
priority: 2
pr: trails#8932
claim: "2026-10-15T12:24:15Z"
assignee: "port-live-response-and-small-http-tests"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionpack/test/dispatch/live_response_test.rb`:
  `ActionController::Live::ResponseTest` (`:8`, tests at `:14-84`), 10 tests, no
  trails file.
- `dispatch/request/session_test.rb`: `SessionIntegrationTest` (`:221`) —
  "session follows rack api contract 1" is missing (21/22).
- `dispatch/content_security_policy_test.rb`: 1 empty skip stub,
  `HelpersContentSecurityPolicyIntegrationTest` (`:828`).

## Acceptance criteria

- `dispatch/live-response.test.ts` ports all 10 tests.
- The two single tests are real.
- `dispatch/content-security-policy.test.ts`'s hand-rolled app builder is
  replaced by the harness's `IntegrationTest.buildApp`
  (`test/abstract_unit.rb:118-176`).
- All three files report complete.
