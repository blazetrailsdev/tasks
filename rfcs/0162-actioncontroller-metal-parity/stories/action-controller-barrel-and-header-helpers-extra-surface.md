---
title: "Remove the invented names on action-controller's barrel, header-utils and params-wrapper root"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-wrap-parameters-class-macro",
    "restructure-http-authentication-into-basic-digest-and-token",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actioncontroller` lists names in files with no
Rails counterpart:

- `packages/actionpack/src/action-controller/index.ts`: `applyParamsWrapper`,
  `deriveWrapperKey`, `inheritedWithHelpers`, `isRateLimited`,
  `wrapParameters` (novel) and `renderForApi` (RFC 0161 (controller rendering) removes it)
- `action-controller/params-wrapper.ts` (78 lines, beside the real
  `metal/params-wrapper.ts`): `applyParamsWrapper`, `deriveWrapperKey`,
  `wrapParameters`. Rails' `ParamsWrapper` is only
  `action_controller/metal/params_wrapper.rb`.
- `action-controller/metal/header-utils.ts`: `deleteHeaderCaseInsensitive`,
  `setHeaderCaseInsensitive`. Rails reads and writes headers through
  `ActionDispatch::Response::Headers` / `Rack::Headers`, which are already
  case-insensitive.
- `metal/params-wrapper.ts`: `nameSet`
- `base.ts`: `viewRuntime` (`:308`) — Rails' is `attr_internal :view_runtime` in
  `ActionController::Instrumentation`, so it belongs on `metal/instrumentation.ts`

## Acceptance criteria

- `action-controller/params-wrapper.ts` and `metal/header-utils.ts` are deleted;
  their callers use the Rails methods.
- `index.ts` exports only Rails-named constants.
- `viewRuntime` lives in `metal/instrumentation.ts`.
- `pnpm parity:api:extra --package actioncontroller` lists no novel name in any
  of these files.
