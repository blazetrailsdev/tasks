---
title: "Cover method-name and object around dispatch in invokeAround"
status: ready
updated: 2026-07-08
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4770 ported Rails' `run_callbacks` around loop onto
`CallbackSequence.invoke`. The new `CallbackSequence.invokeAround`
(packages/activesupport/src/callbacks.ts) dispatches an around callback via
`expand_call_template` + `send`-with-block, handling three CallTemplate
shapes: `instanceExec` (InstanceExec0/1/2), `call` (ProcCall), and the
method-name branch (`MethodCall` / `ObjectCall` — `receiver[method](...args,
block)`).

Only the `instanceExec` shape (function-filter around callbacks, the common
path from `setCallback(..., "around", fn)`) is exercised by tests. The
method-name (`MethodCall`) and `ObjectCall` around branches — where a Symbol
filter or CallbackObject drives `receiver.send(methodName, *args, &block)` —
have no direct coverage, so a regression in the `send`-with-block argument
threading (continuation as last positional arg) would go unnoticed.

Rails covers symbol-around via e.g. `AroundPerson#w0tyes`/`tweedle_dum`
(vendor/rails/activesupport/test/callbacks_test.rb) which yield.

## Acceptance criteria

- [ ] Add a test registering an around callback by method name (Symbol filter)
      whose method receives and invokes the continuation, asserting
      pre/yield/post ordering and that `next()` returns the block value.
- [ ] Add a CallbackObject (`aroundSave`) around test covering the ObjectCall
      dispatch shape.
- [ ] Test names match Rails where a counterpart exists; no bespoke tables.
