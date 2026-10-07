---
title: "ActionController::Instrumentation: process_action, send_file, send_data and redirect_to do not reach super; Logger is not a Concern"
status: closed
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
closed-reason: "superseded by instrumentation-redirect-to-does-not-reach-super-and-logger-is-not-a-concern; process_action/send_file/send_data converged in trails#8606"
---

## Context

The story `rendering-module-keeps-duplicate-free-functions-and-no-class-methods` made
`ActionController::Instrumentation` a `Module` (`packages/actionpack/src/action-controller/metal/instrumentation.ts`)
whose `render` reaches `super` through `superMethod`, as
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/instrumentation.rb:28-34` does. Four gaps are left there:

- **`process_action` is not on the module.** Rails' private `process_action(*)` (`instrumentation.rb:59-87`) calls
  `super`. The trails `processAction` export still takes a `block` in place of `super`, and `Base#processAction`
  (`action-controller/base.ts`) hand-nests `Instrumentation` -> `Rescue` -> `super.processAction`, plus
  `ParamsWrapper`'s body. It is deliberately not registered with `defineMethod`: `Base`'s `super.processAction`
  would reach it and pass `action` where it expects a block.
- **`send_file`, `send_data` and `redirect_to` call their target directly.** Rails' bodies (`instrumentation.rb:36-57`)
  are `super` inside the `instrument` block. The trails bodies call `_sendFile` / `_sendData` /
  `Flash.prototype.redirectTo`. `Base.prototype.redirectTo = _instrumentRedirectTo` is still assigned as an own
  property, because `Flash` is a class module whose `redirectTo` `include` copies onto `Base.prototype`, where it
  shadows the module's link.
- **`include AbstractController::Logger` is a symbol hook.** `instrumentation.rb:19` is a Concern dependency.
  `AbstractController::Logger` (`abstract-controller/logger.ts`) is a class with `static [included]`, so
  `Instrumentation` includes it from its own `[included]` hook. `Redirecting` (`metal/redirecting.ts`) does the same.
- **`ActionController.add_renderer` / `.remove_renderer`** (`metal/renderers.rb:8-18`) live in
  `action-controller/deprecator.ts`, so `parity:api` reports both missing from `metal/renderers.ts` (14/16).

## Acceptance criteria

- [ ] `Instrumentation#processAction` is the `super`-chained Rails body, registered with `defineMethod`;
      `Base#processAction` no longer nests the Instrumentation and Rescue bodies by hand.
- [ ] `sendFile`, `sendData` and `redirectTo` reach their target through `superMethod`, and the
      `Base.prototype.redirectTo` own-property assignment is gone.
- [ ] `AbstractController::Logger` is a Concern `Module`, included with `mod.include(Logger)` by `Instrumentation`
      and `Redirecting`.
- [ ] `addRenderer` / `removeRenderer` are defined in `metal/renderers.ts`; `parity:api` shows `metal/renderers.rb` 16/16.
