---
title: "test-case-process-invented-headers-and-env-options"
status: done
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  - test-case-check-required-ivars-and-setup-callback
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8361
claim: "2026-10-01T22:42:01Z"
assignee: "test-case-process-invented-headers-and-env-options"
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

The controller-class constructor argument is already gone on main; what is left
is `constructor(name?: string)`. Moving the `PostsController` block is ~375
lines counted twice, which does not fit one PR beside the caller rewrite, so
the move and the `name?` constructor are
`test-case-test-trails-only-block-moves-out-of-rails-named-file`.

## Acceptance criteria

- `process` takes Rails' eight keywords only; each `headers:` / `env:` caller
  sets the header on `request` before the call, as its Rails test does.
- `responseBody`, `parsedBody` and `reset` are removed, with the tests that
  exist only to exercise them.
