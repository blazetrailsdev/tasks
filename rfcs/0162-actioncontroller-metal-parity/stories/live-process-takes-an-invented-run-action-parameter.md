---
title: "Live#process takes an invented runAction parameter and dispatches new_controller_thread statically"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8557
claim: "2026-10-05T23:18:04Z"
assignee: "live-process-takes-an-invented-run-action-parameter"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Live#process(name)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:276`) overrides `AbstractController::Base#process`, runs `super(name)` inside `new_controller_thread`, and is what a controller that does `include ActionController::Live` dispatches through. `new_controller_thread` (`:377`) and `response_body=` (`:325`) are instance methods a test can redefine on one controller.

trails' `process` in `packages/actionpack/src/action-controller/metal/live.ts:186-190` takes `(name, runAction)`, an invented second parameter standing in for `super`, and calls `Live.newControllerThread.call(this, ...)` statically (`:193`). So:

- `include(Controller, Live)` puts that `process` on the controller, and `ActionController::TestCase#process` calls it with Rails' argument list: `TypeError: runAction is not a function`.
- An instance override of `newControllerThread` is never reached.

`LiveHeadRenderTest#test_live_head_ok` (`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:985-1008`) is parked on it in `packages/actionpack/src/action-controller/controller/render.test.ts`. Its `setup` redefines `new_controller_thread` and `response_body=` on `@controller` (`:990-999`); the parked port carries only the test body.

## Acceptance criteria

- [ ] `Live#process` takes Rails' parameter list and reaches the next `process` through the module's super chain (`Live.superMethod(this, "process")`), and dispatches `this.newControllerThread(...)` so an instance override is honoured.
- [ ] `test_live_head_ok` is un-skipped with its `setup` ported (both singleton overrides) and passes.
