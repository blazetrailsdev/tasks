---
title: "ParamsWrapper::Options#model uses ?? where Rails uses ||, so a false slot is returned as the model"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::ParamsWrapper::Options#model`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb:104-106`)
is `super || self.model = _default_wrap_model`: Ruby truthiness, so a stored
`false` falls through to `_default_wrap_model` exactly as `nil` does.

trails' reader (`packages/actionpack/src/action-controller/metal/params-wrapper.ts`,
`get model()`) is `super.model ?? (this.model = this._defaultWrapModel())`.
`??` substitutes only for `null` / `undefined`, so a `false` slot is returned
as the model. The reviewer of trails#8603 noted it as predating that PR.

The same file ports `hash[:include] && …` / `hash[:exclude] && …`
(`params_wrapper.rb:92-93`) with the full `!= null && !== false` guard, so the
reader is the odd one out. `Options#include`'s `unless super || exclude`
(`:118`) and `Options#name`'s `unless super || klass.anonymous?` (`:149`) are
ported as `!= null` and should be checked against the same rule.

## Acceptance criteria

- `get model()` computes the default when the raw slot is `nil` or `false`
  (`super.model` is `null` or `false`), as `params_wrapper.rb:105` does.
- The `super ||` guards in `include` and `name` treat `false` as Ruby does, or
  the value is shown unable to be a boolean.
- A `.trails.test.ts` case covers `wrap_parameters` reaching the reader with a
  `false` model slot; it fails on the current body.
