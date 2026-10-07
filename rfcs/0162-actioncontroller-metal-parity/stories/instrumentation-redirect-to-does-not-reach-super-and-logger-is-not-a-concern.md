---
title: "ActionController::Instrumentation#redirect_to does not reach super; AbstractController::Logger is not a Concern; add_renderer lives in deprecator.ts"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Supersedes `instrumentation-module-process-action-and-send-methods-do-not-reach-super`, whose `process_action`,
`send_file` and `send_data` items trails#8606 converged. Left after trails#8607. Rails paths are under `vendor/rails/v8.0.2/`.

- **`redirect_to` does not reach `super`.** `actionpack/lib/action_controller/metal/instrumentation.rb:50-57` is
  `result = super` inside the `instrument` block. `redirectTo` in
  `packages/actionpack/src/action-controller/metal/instrumentation.ts` calls `Flash.prototype.redirectTo` directly, and
  `packages/actionpack/src/action-controller/base.ts` still assigns `Base.prototype.redirectTo = _instrumentRedirectTo`
  as an own property, because `Flash` (`metal/flash.ts`) is a class module whose `redirectTo` `include` copies onto
  `Base.prototype`, where it shadows every `Module` link.
- **`include AbstractController::Logger` is a symbol hook.** `instrumentation.rb:19` is a plain `include` of a Concern
  (`actionpack/lib/abstract_controller/logger.rb`: `included do config_accessor :logger end`,
  `include ActiveSupport::Benchmarkable`). `packages/actionpack/src/abstract-controller/logger.ts` is a class with
  `static [included]`, so `Instrumentation` and `Redirecting` (`metal/redirecting.ts`) include it from their own
  `[included]` hook. `Instrumentation` is also not `extend`ed with `Concern` and has no `ClassMethods`
  (`instrumentation.rb:17,108-117`): `Base` assigns `static logProcessAction` by hand.
- **`ActionController.add_renderer` / `.remove_renderer`** (`actionpack/lib/action_controller/metal/renderers.rb:8-18`)
  live in `action-controller/deprecator.ts`, so `parity:api` reports `metal/renderers.rb` 14/16.

## Acceptance criteria

- [ ] `Flash` is a `Module`; `Instrumentation#redirectTo` reaches it through `superMethod`; the
      `Base.prototype.redirectTo` assignment is gone.
- [ ] `AbstractController::Logger` is a Concern `Module` included with `mod.include(Logger)` by `Instrumentation` and
      `Redirecting`; `Instrumentation` is a Concern carrying `ClassMethods.logProcessAction`.
- [ ] `addRenderer` / `removeRenderer` are defined in `metal/renderers.ts`; `metal/renderers.rb` is 16/16.
