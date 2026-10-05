---
title: "ParamsWrapper#process_action is inlined into Base#processAction with a request guard and a params rebuild"
status: draft
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::ParamsWrapper#process_action`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb:260-263`)
is a module method that wraps and calls `super`:

    def process_action(*)
      _perform_parameter_wrapping if _wrapper_enabled?
      super
    end

trails has no `processAction` in `metal/params-wrapper.ts`. The body is inlined
into `Base#processAction`
(`packages/actionpack/src/action-controller/base.ts`, the
`_instrumentProcessAction` / `_rescueProcessAction` closure), where
`parity:api:extra --package actioncontroller` reports it as
`base.ts processAction inlined-from metal/params_wrapper.rb (process_action)`,
and it carries two things Rails' body does not:

- a `this.request &&` guard before `_wrapperEnabled`;
- after `_performParameterWrapping`, it rebuilds the controller's params:
  `this.params = new StrongParameters({ ...this.request.params, ...this.request.pathParameters })`.
  Rails needs no rebuild because `StrongParameters#params`
  (`metal/strong_parameters.rb`, `@_params ||= ... Parameters.new(request.parameters)`)
  is built lazily after wrapping, from the same Hash `_perform_parameter_wrapping`
  merged into (`params_wrapper.rb:309`).

`ParamsWrapper` is also in `Base.MODULES` by name only; it is not `include`d,
so `_wrapperKey` / `_wrapperFormats` / `_wrapParameters` / `_extractParameters`
/ `_wrapperEnabled` / `_performParameterWrapping` are reached with
`.call(this as unknown as ParamsWrapperHost)` rather than as methods.

## Acceptance criteria

- `metal/params-wrapper.ts` exports `processAction` with Rails' two-line body
  and `ParamsWrapper` is mixed into `Base` (`include()` / `Included<>`), so the
  private helpers are methods on the controller and the `super` chain reaches
  the next module's `process_action`.
- `Base#processAction` no longer names `_wrapperEnabled` /
  `_performParameterWrapping`, has no `this.request &&` guard for them, and does
  not reassign `this.params`; the wrapped keys reach `params` through the Rails
  path (`params` built from `request.parameters` after wrapping).
- The `inlined-from metal/params_wrapper.rb (process_action)` row is gone from
  `pnpm parity:api:extra --package actioncontroller`, and
  `metal/params_wrapper.rb` gains `process_action` in `pnpm parity:api`.
- `controller/params-wrapper.test.ts` and `base-params-wrapper.test.ts` stay
  green.
