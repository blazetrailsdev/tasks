---
title: "actioncontroller-live-as-includable-module"
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

`ActionController::Live` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb`) is a
Concern that controllers `include`. trails ports it as free functions in
`packages/actionpack/src/action-controller/metal/live.ts` (`process`,
`newControllerThread`, `cleanUpThreadLocals`, `responseBody`, `sendStream`, ...)
with no module object, so nothing can answer Ruby's `klass < ActionController::Live`.

Two Rails bodies branch on that and are unported because of it:

- `ActionController::TestCase::Behavior#setup_controller_request_and_response`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:569-572`):
  `if klass < ActionController::Live then @response_klass = LiveTestResponse`.
  trails' `setupControllerRequestAndResponse`
  (`packages/actionpack/src/action-controller/test-case.ts`) always uses `TestResponse`
  (surfaced in review of trails#8286).
- `test_case.rb:20-38` reopens `Live` to alias and redefine `new_controller_thread`
  / `clean_up_thread_locals`. Because `live.ts`'s `process` calls the free
  `newControllerThread` directly (not through `this`), a redefinition cannot take
  effect; and `test-case.ts` is exported from the package index, so a module-level
  override there would reach production (`live.ts` also carries the
  `originalNewControllerThread` / `originalCleanUpThreadLocals` aliases that belong
  to `test_case.rb`).

## Acceptance criteria

- `ActionController::Live` exists as an includable module (`include()` /
  `Included<>`), and `process` dispatches `new_controller_thread` /
  `clean_up_thread_locals` through the receiver as `live.rb:274-310` does.
- `setupControllerRequestAndResponse` ports the `klass < ActionController::Live`
  arm, selecting `LiveTestResponse`.
- The `test_case.rb:20-38` `alias_method` + redefinitions live in `test-case.ts`
  on the Live module, without changing production Live behaviour for callers
  that never load the test harness (or the load-order question is resolved and
  recorded).
