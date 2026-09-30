---
title: "test-case-never-selects-live-test-response"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionController::TestCase::Behavior#setup_controller_request_and_response`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:564-589`) picks the
response class from the controller: `@response_klass = ActionDispatch::TestResponse`, then
`if klass < ActionController::Live` it switches to `LiveTestResponse` (`:567-571`), and
`build_response(klass)` is `klass.create` (`:591-593`).

trails cannot express `klass < ActionController::Live`, because there is no includable
`ActionController::Live` module. `packages/actionpack/src/action-controller/metal/live.ts`
exports the Live pieces as free functions and classes (`process`, `responseBody`,
`sendStream`, `makeResponseBang`, `Response`, `Buffer`, `SSE`). Nothing is `include()`d into
a controller, so there is no ancestry to test. As a result
`packages/actionpack/src/action-controller/test-case.ts`'s `setupControllerRequestAndResponse`
always builds a plain `Response`: `LiveTestResponse` is exported but never selected, and
`buildResponse()` takes no `klass`.

## Acceptance criteria

- [ ] `ActionController::Live` exists as a module that a controller `include()`s (with its
      `included` hook / ClassMethods such as `makeResponseBang`), mirroring
      `action_controller/metal/live.rb`.
- [ ] `TestCase#setupControllerRequestAndResponse` sets `_responseKlass` and selects
      `LiveTestResponse` when the controller class includes `Live`.
- [ ] `buildResponse(klass)` returns `klass.create()`, matching `test_case.rb:591-593`.
