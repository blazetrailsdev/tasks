---
title: "Compile CallbackObject to ObjectCall honouring chain scope"
status: in-progress
updated: 2026-07-17
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4918
claim: "2026-07-17T01:21:11Z"
assignee: "callback-object-compiles-to-objectcall"
blocked-by: null
closed-reason: null
---

## Context

trails' `setCallback` resolves a CallbackObject through `resolveCallbackObject`
(packages/activesupport/src/callbacks.ts:97-115), which wraps the object into a
plain around/before/after **function** keyed by `${kind}${CamelName}` (e.g.
`aroundSave`). That function then compiles to `InstanceExec{0,1,2}` in
`Callback.compiled` (callbacks.ts:684-703). Consequently the `ObjectCall`
CallTemplate (callbacks.ts:206-242) — and the object-dispatch branch of
`CallbackSequence.invokeAround` (callbacks.ts:812-815) — is **never produced by
production code**; it is only reachable by constructing an `ObjectCall`
directly (as the test added in #4915 does).

This diverges from Rails. In Rails, `CallTemplate.build` compiles a callback
object to `ObjectCall.new(target, method)` where `method` is the callback's
`current_scopes.join("_")` (activesupport/lib/active_support/callbacks.rb:510,
:574). With the default `CallbackChain` scope `[:kind]` the method is `around`
(test_around_object, callbacks_test.rb:716,745); with `scope: [:kind, :name]`
it is `around_save` / `before_save` (CustomScopeObject, test_customized_object,
callbacks_test.rb:763). trails hard-codes the `${kind}${Name}` shape only and
never honours the chain's `scope` config for object callbacks, so:

- Rails' default-scope object method name (`around`) is not what trails calls
  (it calls `aroundSave`), and
- the `ObjectCall` dispatch path is dead in production.

## Acceptance criteria

- [ ] `Callback.compiled` compiles a CallbackObject to an `ObjectCall`
      CallTemplate (not an InstanceExec-wrapped function), honouring the chain's
      `scope` config for the dispatched method name via `currentScopes()`
      (callbacks.ts:723-728), matching Rails `CallTemplate.build`.
- [ ] Default scope `[:kind]` dispatches the bare `around` / `before` / `after`
      method; `scope: [:kind, :name]` dispatches `aroundSave` etc.
- [ ] Port Rails `test_around_object` and `test_customized_object` through the
      public `setCallback` API (no directly-constructed templates); canonical
      test only, names match Rails verbatim.
- [ ] `resolveCallbackObject`'s function-wrapping deviation is removed or reduced
      to the paths that genuinely need it.
