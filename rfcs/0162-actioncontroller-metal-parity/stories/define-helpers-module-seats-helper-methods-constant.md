---
title: "define_helpers_module seats the module as the HelperMethods constant, not a WeakMap"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Helpers::ClassMethods#define_helpers_module`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:247-254`):

```ruby
return klass.const_get(:HelperMethods) if klass.const_defined?(:HelperMethods, false)

mod = Module.new
klass.const_set(:HelperMethods, mod)
mod.include(helpers) if helpers
mod
```

trails' `defineHelpersModule`
(`packages/actionpack/src/abstract-controller/helpers.ts`) keeps the module in a
module-private `helperMethodsByClass` WeakMap instead of seating it as the
`HelperMethods` constant on the controller class. Since trails#8577 the module
is a ruby-compat `Module`, so nothing blocks the seat any more. Because the
module is never bound under an owner it has no classpath, which is why
`HelperTest` "default helpers only"
(`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb`) cannot assert
`"MeTooController::HelperMethods"` in `_helpers.ancestors`: the test's local
`ancestors` probe in
`packages/actionpack/src/action-controller/controller/helper.test.ts` still
walks a prototype chain and needs to read the Module's ancestry instead.

## Acceptance criteria

- `defineHelpersModule` returns `klass.HelperMethods` when the class owns that
  constant, else seats a new `Module` with `rbModConstSet(klass, "HelperMethods", mod)`;
  the `helperMethodsByClass` WeakMap is deleted.
- A controller's helpers module is named `<Controller>::HelperMethods`.
- The `ancestors` probe in `helper.test.ts` reads the Module's ancestry
  (own module, then included modules, nested included), not `Object.getPrototypeOf`.
