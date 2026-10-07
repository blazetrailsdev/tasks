---
title: "Rescue and Instrumentation process_action are module methods chained through super, not a hand-written nest in Base"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8606
claim: "2026-10-06T23:54:42Z"
assignee: "rescue-and-instrumentation-process-action-chain-through-super"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Rescue#process_action` and `Instrumentation#process_action` are module methods that call `super`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rescue.rb:26-31`,
`metal/instrumentation.rb:59-95`), so the `MODULES` include order
(`action_controller/base.rb:225-271`) alone composes the chain.

trails ports each as an exported function taking a `block` (`packages/actionpack/src/action-controller/metal/rescue.ts`
`processAction`, `metal/instrumentation.ts` `processAction`), and `Base#processAction`
(`packages/actionpack/src/action-controller/base.ts`) nests the two by hand around Rendering's `processAction` and
`super.processAction`. trails#8572 made `Rescue` a `Module` including `ActiveSupport::Rescuable` and put the hand-written
nest in Rails' ancestor order, but left the nest itself. `metal/rendering.ts` already shows the converged shape:
`mod.defineMethod("processAction", ...)` calling `mod.superMethod(this, "processAction")`.

The ParamsWrapper half is `params-wrapper-process-action-is-inlined-into-base`.

## Acceptance criteria

- `Rescue` and `Instrumentation` each define `processAction` on their module with Rails' body and reach the next link
  through `superMethod`; neither takes a `block` parameter.
- `Base#processAction` no longer names Rescue's or Instrumentation's `processAction`; the include order composes them.
- `ActionController::API` gets the same chain from the same modules.
