---
title: "ParamsWrapper's inherited body never runs, so a controller subclass keeps its parent's wrapper klass and name"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::ParamsWrapper::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb:244-251`)
runs when a controller subclass is defined: if the inherited
`_wrapper_options.format.any?`, it dups the options, sets `klass` to the
subclass and assigns them, so the subclass derives its own wrapper name and
model (`Options#name` `:141-153`, `_default_wrap_model` `:162-184`).

trails ports the body as `inheritedParamsWrapper`
(`packages/actionpack/src/action-controller/metal/params-wrapper.ts`), seated on
`Base` and `API`, but nothing calls it outside tests: JS has no hook when a
class is defined. So `class AdminsController extends UsersController`, with
wrapping enabled on an ancestor, reads the ancestor's `Options` through the
class attribute, with the ancestor's `klass` and its memoized `name` /
`include`, and wraps under the wrong key. The ported Rails tests
(`controller/params-wrapper.test.ts`, `with_default_wrapper_options`,
`params_wrapper_test.rb:8-12`) call it by hand, as Rails' helper calls
`inherited`, so they do not cover the gap.

CLAUDE.md § "`inherited` is deferred to own-property memo guards" is the
settled deferral for a missing `inherited`.

## Acceptance criteria

- A controller subclass that never calls `wrap_parameters` gets, on its first
  `_wrapperOptions` read, the state `inherited` leaves behind: when the
  inherited options' `format` is non-empty, its own dup with `klass` set to the
  subclass (own-property guard, no step at class definition).
- A `.trails.test.ts` case covers `class AdminsController extends UsersController`
  with `format: [":json"]` on the parent wrapping under `admin`, and fails on
  the current code.
- `inheritedParamsWrapper` has no caller left outside the guard and the ported
  Rails helper, or is folded into the guard.
