---
title: "test-case-process-invented-headers-and-env-options"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  - test-case-check-required-ivars-and-setup-callback
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestCase::Behavior#process`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:508`) takes
`method:, params:, session:, body:, flash:, format:, xhr:, as:` and nothing
else. A test sets a header on the held request first
(`@request.headers["Referer"] = ...`, `test_case_test.rb:606`).

trails' `TestCase#process`
(`packages/actionpack/src/action-controller/test-case.ts`) also accepts
`headers:` and `env:` through `RequestOptions`, and writes them onto the
request before `setupRequest`. Neither has a Rails counterpart. Callers:
`controller/mime/respond-to.test.ts`, `controller/request-forgery-protection.test.ts`,
`metal/request-forgery-protection.test.ts`,
`metal/request-forgery-protection.trails.test.ts` and
`controller/test-case.test.ts`.

The same file carries more invented surface with no Rails counterpart:
`TestCase#responseBody`, `#parsedBody`, `#reset`, and a constructor that takes
the controller class where Rails resolves it from `tests` /
`determine_default_controller_class` (`test_case.rb:392-419`).
`test-case.test.ts` still opens with a `describe("TestCaseTest")` of trails-only
tests over a `PostsController` that exercise them; they belong in
`test-case.trails.test.ts`.

## Acceptance criteria

- `process` takes Rails' eight keywords only; each `headers:` / `env:` caller
  sets the header on `request` before the call, as its Rails test does.
- `responseBody`, `parsedBody`, `reset` and the constructor argument are removed
  or carry a receipt, and the trails-only tests move out of the Rails-named
  test file.
