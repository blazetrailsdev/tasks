---
title: "process_action passes error.class.name: path-seat actionpack errors so rbObjClassname answers it"
status: in-progress
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9074
claim: "2026-10-19T15:31:51Z"
assignee: "instrumentation-status-code-reads-the-exception-class-path"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Instrumentation#process_action`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/instrumentation.rb:81`) is
`ActionDispatch::ExceptionWrapper.status_code_for_exception(error.class.name)`. The port
(`packages/actionpack/src/action-controller/metal/instrumentation.ts`) passes
`classNameOf(error)` (`action-dispatch/middleware/exception-wrapper.ts:63`), which reads
`error.name`. The settled port of `x.class.name` is `rbObjClassname(x)`
(`RUBY_COMPAT_CHAIN_EXPORTS`, `scripts/api-compare/naming-taxonomy.ts`), but today it
answers the bare constructor name for actionpack's errors: `RoutingError`,
`UnknownFormat`, `ActionNotFound` where Ruby answers `ActionController::RoutingError` and
the `rescue_responses` keys need that path. The classes are not path-seated
(`rbModConstSet`) under their namespaces.

`ExceptionWrapper#initialize` (`exception_wrapper.rb`) reads `exception.class.name`
through the same `classNameOf`.

## Acceptance criteria

- actionpack's exception classes are seated so `rbObjClassname(new RoutingError(""))` is
  `"ActionController::RoutingError"` (likewise every class keyed in `rescue_responses`).
- `process_action` and `ExceptionWrapper` pass `rbObjClassname(error)`, and the
  `@missingRailsName name` receipt on `processAction` is removed.
- `classNameOf` is deleted if nothing else needs it.
