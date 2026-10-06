---
title: "BasicImplicitRender#send_action lives on its module with Rails' (method, *args) signature"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8576
claim: "2026-10-06T14:01:14Z"
assignee: "callback-object-filter-type-and-csrf-private-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8507, which made `AbstractController::Base#process_action` dispatch
through `sendAction` and put the implicit-render override on the `Base` class body
(`packages/actionpack/src/action-controller/base.ts`, `override async sendAction`).

Rails defines that override in two modules, each calling `super`:

- `BasicImplicitRender#send_action(method, *args)`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/basic_implicit_render.rb:7-11`):
  `ret = super; default_render unless performed?; ret`.
- `ImplicitRender` includes `BasicImplicitRender`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/implicit_render.rb`).

trails' file-level `sendAction` exports in
`packages/actionpack/src/action-controller/metal/basic-implicit-render.ts` and
`metal/implicit-render.ts` take `(method: () => unknown)`, a thunk, not Rails'
`(method, *args)`. Nothing calls them: they exist only to credit the parity row,
and they check `performed` before an async action has finished.

## Acceptance criteria

- `BasicImplicitRender` and `ImplicitRender` are modules included into `API` /
  `Base` as Rails includes them; `send_action(method, *args)` lives on
  `BasicImplicitRender`, reaches the next link with the module `super` mechanism,
  and awaits it before `default_render unless performed?`.
- The `sendAction` override on the `Base` class body and the thunk-taking exports
  are gone.
