---
title: "ActionController::Rescue includes ActiveSupport::Rescuable; Base drops its hand-rolled rescue handlers"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8572
claim: "2026-10-06T13:37:24Z"
assignee: "action-controller-rescue-includes-activesupport-rescuable"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Rescue` is `include ActiveSupport::Rescuable`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rescue.rb:11`), so
`rescue_from` and `rescue_with_handler` on a controller are Rescuable's
(`vendor/rails/v8.0.2/activesupport/lib/active_support/rescuable.rb`), reading
the `rescue_handlers` class attribute.

trails' `Base` hand-rolls all of it in
`packages/actionpack/src/action-controller/base.ts`: a private static
`_rescueHandlers` list, `static rescueFrom(errorClass, handler)` (two
positionals, where Rails takes `*klasses, with:` or a block),
`rescueWithHandler` and the private `_findRescueHandler` cause-walk. Found
while converging `Rescue#process_action` (`rescue.rb:26-31`), whose port in
`metal/rescue.ts` now calls `this.rescueWithHandler(exception)`.
`metal/rescue.ts` also still exports the invented `RescueRegistry`
(`findHandler`, `processWithRescue`), re-exported from `action-controller/index.ts`.

`Base#processAction` also composes the `super` chain by hand —
Instrumentation, then Rescue, then Rendering's `process_action` and
ParamsWrapper's — where Rails' `MODULES` order
(`action_controller/base.rb:225-271`) makes ParamsWrapper outermost and
Rendering innermost.

## Acceptance criteria

- `Rescue` is a module including `ActiveSupport::Rescuable`, included into
  `Base`; `rescueFrom` / `rescueWithHandler` / `handlerForRescue` are
  Rescuable's, with Rails' signatures, and `Base`'s `_rescueHandlers`,
  `rescueFrom`, `rescueWithHandler` and `_findRescueHandler` are deleted.
- `RescueRegistry` is deleted from `metal/rescue.ts` and the barrel.
- `Base#processAction` wraps in Rails' ancestor order.
- Every `rescueFrom(Klass, handler)` caller passes `{ with: handler }`.
