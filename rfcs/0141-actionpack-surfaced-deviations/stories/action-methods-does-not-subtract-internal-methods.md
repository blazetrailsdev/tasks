---
title: "actionpack: AbstractController.actionMethods filters a hand-kept set instead of public methods minus internal_methods (abstract_controller/base.rb:77-107)"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:77-107`:

```ruby
def internal_methods
  controller = self
  methods = []
  until controller.abstract?
    methods += controller.public_instance_methods(false)
    controller = controller.superclass
  end
  controller.public_instance_methods(true) - methods
end

def action_methods
  @action_methods ||= begin
    methods = public_instance_methods(true) - internal_methods
    methods.concat(public_instance_methods(false))
    methods.map!(&:to_s)
    methods.to_set
  end
end
```

Action methods are everything public minus what the first abstract superclass defines.

`packages/actionpack/src/abstract-controller/base.ts` ports `internalMethods` in that shape, but nothing calls it. `actionMethods` instead walks the prototype chain up to `AbstractController.prototype` and filters against a hand-kept `AbstractController._internalMethods` set and a leading-underscore test. Until trails#8450 no class was abstract, so `internalMethods` could not have given Rails' answer; `AbstractController::Base`, `ActionController::Metal`, `ActionController::Base` and `ActionController::API` are abstract now.

## Converged shape

`actionMethods` is `publicInstanceMethods(true) - internalMethods()` plus the class's own public methods, as `base.rb:97-107`, and the hand-kept `_internalMethods` set goes away or shrinks to what Rails itself lists.

## Acceptance criteria

- [ ] `actionMethods` calls `internalMethods`, with Rails' two-step shape.
- [ ] A method defined on `ActionController::Base` or `Metal` is not an action; one defined on `ApplicationController` or below is.
- [ ] The existing `action_methods` tests pass unchanged; `pnpm api:calls` credits the `internal_methods` call.
