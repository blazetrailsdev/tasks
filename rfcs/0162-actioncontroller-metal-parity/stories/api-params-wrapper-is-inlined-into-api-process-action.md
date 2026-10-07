---
title: "ActionController::API wires ParamsWrapper inline instead of including the module"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps:
  - params-wrapper-process-action-is-inlined-into-base
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8613
claim: "2026-10-07T02:11:50Z"
assignee: "api-params-wrapper-is-inlined-into-api-process-action"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::API` includes `ParamsWrapper` as the last entry of `MODULES`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:115-150`), so
`wrap_parameters`, `_set_wrapper_options`, the `_wrapper_options` class
attribute (`metal/params_wrapper.rb:186-188`) and `process_action`
(`metal/params_wrapper.rb:260-263`) all reach it through the module.

trails' `packages/actionpack/src/action-controller/api.ts` had no wrapper at
all. The PR that ported `controller/api/params_wrapper_test.rb` wired it the way
`base.ts` does: a `classAttribute` call in a `static {}` block,
`static wrapParameters = wrapParameters` / `static _setWrapperOptions`, and a
`processAction` override that calls `_wrapperEnabled` /
`_performParameterWrapping` with `.call(this as unknown as ParamsWrapperHost)`
before `super.processAction`. `parity:api:extra --package actioncontroller`
reports `api.ts` `wrapParameters` and `is_wrapperOptions` as moved extras.

`params-wrapper-process-action-is-inlined-into-base` converges the same shape
on `Base` by exporting `processAction` from `metal/params-wrapper.ts` and
mixing `ParamsWrapper` in with `include()`. Its acceptance criteria name `Base`
only.

## Acceptance criteria

- `API` mixes `ParamsWrapper` in the way `Base` does after
  `params-wrapper-process-action-is-inlined-into-base`, in `MODULES` order
  (`api.rb:115-146`), and `api.ts` holds no wrapper `classAttribute` call,
  no `static wrapParameters` / `_setWrapperOptions` / `inheritedParamsWrapper`
  assignment and no `processAction` override naming the wrapper helpers.
- `parity:api:extra --package actioncontroller` no longer lists
  `wrapParameters` or `is_wrapperOptions` under `api.ts`.
- `controller/api/params-wrapper.test.ts` stays green.
