---
title: "ParamsWrapper::ClassMethods and its class_attribute are wired by hand on Base and API, not handed over by Concern"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8613
claim: "2026-10-07T02:37:34Z"
assignee: "params-wrapper-class-methods-are-assigned-by-hand-on-base-and-api"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::ParamsWrapper`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb`)
is a Concern. Its `included do class_attribute :_wrapper_options, default:
Options.from_hash(format: []) end` (`:184-186`) and its `ClassMethods`
(`:188-251`: `_set_wrapper_options`, `wrap_parameters`, `inherited`) reach a
controller class through `include ParamsWrapper` alone.

Since trails#8610 `packages/actionpack/src/action-controller/metal/params-wrapper.ts`
exports a `ParamsWrapper` `Module` extended with `Concern`, carrying
`processAction` and the six private helpers, and `Base` and `API` include it.
The class half is still wired by hand in both
`packages/actionpack/src/action-controller/base.ts` and `api.ts`: a `static {}`
block calling `classAttribute.call(this, "_wrapperOptions", ...)` and
`deferInherited.call(this)`, plus `static _setWrapperOptions`,
`static wrapParameters` and `static inheritedParamsWrapper` assignments.
`api.ts` carries `@noRailsEquivalent CONVERGEABLE` receipts on two of them.

## Acceptance criteria

- [ ] `ParamsWrapper.ClassMethods` is a `Module` carrying `_setWrapperOptions`
      and `wrapParameters` (`params_wrapper.rb:189-241`), handed over by
      `Concern` on include.
- [ ] The `class_attribute :_wrapper_options` declaration runs from the
      module's `included` block (`params_wrapper.rb:184-186`), once, not from a
      `static {}` block in each of `base.ts` and `api.ts`.
- [ ] `base.ts` and `api.ts` hold no `static _setWrapperOptions`,
      `static wrapParameters` or `static inheritedParamsWrapper` assignment.
      `inherited` stays deferred as CLAUDE.md § "`ParamsWrapper::ClassMethods#inherited`
      runs at a subclass's first `_wrapper_options` read" ratifies, installed
      from the module.
- [ ] `controller/params-wrapper.test.ts` and `metal/params-wrapper*.test.ts`
      stay green.
