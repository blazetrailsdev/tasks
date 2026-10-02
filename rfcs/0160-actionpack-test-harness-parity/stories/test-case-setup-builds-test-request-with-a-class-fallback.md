---
title: "setup_controller_request_and_response falls back to the class under test when building the TestRequest"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8380, which moved the body into `Behavior` unchanged.

Rails' `setup_controller_request_and_response`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:564-590`) builds
the request from the controller it holds:

```ruby
@request = TestRequest.create(@controller.class)
```

(`:582`). When no controller could be built, `@controller` is `nil` and the argument
is `NilClass`.

trails' `setupControllerRequestAndResponse`
(`packages/actionpack/src/action-controller/test-case.ts`) passes
`this.controller?.constructor ?? klass`, so with no controller it hands
`TestRequest.create` the class under test instead. `TestRequest.create`
(`:44-49` in the same Rails file) stores that argument as `controller_class`, which
`TestRequest#controller_class` (`:55`) answers to the router.

## Acceptance criteria

- The call is `TestRequest.create(this.controller.constructor)`'s faithful port: the
  argument derives from `this.controller` alone, with no fallback to `klass`.
- A test with a controller class that cannot be constructed shows what
  `request.controllerClass` answers, matching Rails.
- `parity:api:calls:args` stays green for `test_case.rb`.
