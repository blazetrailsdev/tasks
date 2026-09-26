---
title: "Tse handler wraps template code in a nested function instead of inlining it into the method"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
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

Rails inlines a handler's code into the compiled method body:
`def #{method_name}(...)\n @virtual_path = ...;#{locals_code};#{code}\n end`
(`actionview/lib/action_view/template.rb:461-465`), so every template frame's
label is `method_name`, which `ExceptionWrapper#build_backtrace` matches
(`actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:254-275`).

trails' Tse handler (`packages/actionview/src/template/handlers/tse.ts`) returns
an IIFE, `(function <methodName>(context, locals) { ... })(this, localAssigns)`,
and `Template#compiledSource` returns it. trails#8141 names the inner function
after `template.methodName()` so the throw frame carries the right label, but
the call-site frame also carries it and remaps to a compiled line past the end
of the template (translate returns null there).

## Converged shape

The handler emits statements that `compiledSource` inlines into the method body
(with the method returning the output buffer, as Erubi's trailing
`@output_buffer` does), so there is exactly one template frame per render and no
nested function.

## Acceptance criteria

- A raising `.tse` template produces exactly one backtrace frame labeled with the template's method name.
- `TseTemplate.methodName` is no longer read by the handler.
- Raw/Html/custom handlers keep working (they return expressions today; decide the contract per `template.rb:461-465`).
