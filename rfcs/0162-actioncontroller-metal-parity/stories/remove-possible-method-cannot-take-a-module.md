---
title: "removePossibleMethod cannot take a Module, so Renderers.remove inlines it"
status: closed
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "converged in trails#8607: removePossibleMethod takes a Module and Renderers.remove calls it"
---

## Context

`Module#remove_possible_method` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/remove_method.rb:7-11`) is
`undef_method(method) if method_defined?(method) || private_method_defined?(method)`.

trails' `removePossibleMethod` (`packages/activesupport/src/core-ext/module/remove-method.ts`) takes a `{ prototype }`
host and overwrites the property with `undefined`. It cannot be handed a ruby-compat `Module`, so
`ActionController::Renderers.remove` (`packages/actionpack/src/action-controller/metal/renderers.ts`, Rails
`actionpack/lib/action_controller/metal/renderers.rb:82-86`) spells the body inline as
`Renderers.isMethodDefined(methodName)` then `Renderers.undefMethod(methodName)`, under a
`@missingRailsCall remove_possible_method` receipt pointing here (trails#8607).

## Acceptance criteria

- [ ] `removePossibleMethod` is the Rails body (`method_defined?` / `private_method_defined?` then `undef_method`) and
      accepts a ruby-compat `Module` as well as a class.
- [ ] `Renderers.remove` calls `removePossibleMethod` and its `@missingRailsCall` receipt is removed.
