---
title: "activesupport: define_callbacks does not generate _run_<name>_callbacks, so Validations::Callbacks hand-writes and includes it"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8441
claim: "2026-10-03T10:25:22Z"
assignee: "attribute-method-pattern-drops-camel-joined-recasing"
blocked-by: null
closed-reason: null
---

## Context

Rails' `define_callbacks`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:905-925`)
generates three methods per callback name:

```ruby
def _run_#{name}_callbacks(&block)
  run_callbacks #{name.inspect}, &block
end

def self._#{name}_callbacks
  get_callbacks(#{name.inspect})
end

def self._#{name}_callbacks=(value)
  set_callbacks(#{name.inspect}, value)
end
```

trails' `defineCallbacks` (`packages/activesupport/src/callbacks.ts`) defines
only the two class accessors (`_${name}Callbacks`). The instance runner is not
generated, so `ActiveModel::Validations::Callbacks`
(`packages/activemodel/src/validations/callbacks.ts`) writes
`_runValidationCallbacks` by hand and mixes it in with a second
`include(base, { _runValidationCallbacks })` that
`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/callbacks.rb:25-30`
does not have: its `included do` is `include ActiveSupport::Callbacks` and
`define_callbacks :validation, …`, nothing else.

## Acceptance criteria

- [ ] `defineCallbacks` defines `_run<Name>Callbacks` on the target, delegating to `runCallbacks(name, block)` as `callbacks.rb:912-914` does.
- [ ] `validations/callbacks.ts`'s hand-written `_runValidationCallbacks` and its extra `include` are deleted; `runValidationsBang` calls the generated method.
- [ ] Other hand-written `_run*Callbacks` in the repo are converged or listed.
- [ ] activemodel and activerecord callback and validation tests green; `pnpm parity:api:calls` green.
