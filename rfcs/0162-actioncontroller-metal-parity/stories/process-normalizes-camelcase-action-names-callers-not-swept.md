---
title: "AbstractController#process underscores the action because callers still pass the JS method name"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8573
claim: "2026-10-06T15:16:54Z"
assignee: "process-normalizes-camelcase-action-names-callers-not-swept"
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Base#process` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:152-162`) is `@_action_name = action.to_s`. Since `action-name-is-underscored-at-each-template-lookup-site`, trails' `action_name` is the Rails name (`hello_world`), `action_methods` answers Rails names, and `method_for_action` (`base.rb:284-290`) is where the name becomes the JS method (`helloWorld`).

Callers were not swept, so `process` (`packages/actionpack/src/abstract-controller/base.ts`) still normalizes with `this._actionName = underscore(String(action))`, a call Rails does not make, receipted `@inventedArm underscore — CONVERGEABLE` against this story. Roughly 560 test call sites still pass the JS spelling (`get("helloWorld")`, `process("helloWorld")`: ~444 in `packages/actionpack/src`, ~121 in `packages/trailties/src`) and ~113 route strings do (`to: "posts#helloWorld"`), where Rails' tests pass `:hello_world` / `"posts#hello_world"`.

A side effect of the normalization: `underscore` also maps `-` to `_`, so an `action_missing` controller sees `foo_bar` for a dispatched `foo-bar`.

## Acceptance criteria

- [ ] Every `get` / `post` / `process` / `dispatch` call site and every `controller#action` route string passes the Rails action name (`hello_world`), as the Rails test it mirrors does.
- [ ] `process` is `this._actionName = String(action)` and the `@inventedArm underscore` receipt is deleted.
- [ ] `packages/trailties/src/commands/unused-routes.ts`'s `String(this.actionName) in this.controllerClass.prototype` resolves the Rails action name to the JS method the way `method_for_action` does.
