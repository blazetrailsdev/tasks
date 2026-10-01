---
title: "test-case-check-required-ivars-and-setup-callback"
status: in-progress
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8343
claim: "2026-10-01T17:15:02Z"
assignee: "test-case-check-required-ivars-and-setup-callback"
blocked-by: null
closed-reason: null
---

## Context

Left over from `test-case-missing-methods-and-arity`. `pnpm parity:api --package actioncontroller`
reports `test_case.rb` at 58/60. Three things remain, and they depend on each other.

1. **`check_required_ivars`** (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:685-693`)
   is the first line of `process` (`:514`). It raises `"@routes is nil: make sure you set it in your
test's setup method."` when `@routes`, `@controller`, `@request` or `@response` is unset. trails'
   `TestCase` (`packages/actionpack/src/action-controller/test-case.ts`) never sets `routes`, because
   its `setupRequest` does not do what Rails' does (`:605-627`): it writes `PATH_INFO` and
   `path_parameters` by hand where Rails calls `@routes.generate_extras(...)`,
   `generated_path` / `query_parameter_names`, and `@request.assign_parameters(@routes, ...)`.
   Adding the call now reds about 190 actionpack tests with `@routes is nil`. Converge `setupRequest`
   onto `@routes`, have the test classes set `routes` in setup as Rails' tests do, then port
   `checkRequiredIvars` and call it.
2. **`setup :setup_controller_request_and_response`** (`test_case.rb:597-603`, `included do`). In
   trails the `TestCase` constructor takes the controller class and calls
   `setupControllerRequestAndResponse()` directly. Rails reads `self.class.controller_class` and
   runs the method as a `setup` callback. Register it with `TestCase.setup`, stop calling it from
   the constructor, and have the callers (`new TestCase(X)` in about 8 test files) go through
   `tests` plus `beforeSetup`. The `klass < ActionController::Live` → `LiveTestResponse` arm
   (`:569-571`) is also missing.
3. **`should_multipart?`** (`test_case.rb:154`) is already ported, as `Encoder#shouldMultipart` in
   `test-case.ts`. It is reported missing because `scripts/api-compare/extract-ruby-api.rb` puts the
   `ENCODER = Class.new do … end.new` body (`:151-176`) on `TestRequest`. The extractor should host
   those methods on the anonymous class, the way it hosts `Struct.new` bodies (`:602-633` of the
   extractor), or trails needs a TS spelling the extractor can match.

## Acceptance criteria

- `check_required_ivars`: shipped by trails#8322, with the `setupRequest` convergence it
  depended on. Items 2 and 3 remain.
- `setupControllerRequestAndResponse` runs as a `setup` callback, not from the constructor.
- `test_case.rb` reports 60/60 in `pnpm parity:api --package actioncontroller`.
