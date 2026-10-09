---
title: "API.without_modules ignores its arguments and api.rb's load hooks are not run; Base::MODULES is a name list"
status: ready
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/api.ts` now carries `API.MODULES`
and includes each entry in a loop, as
`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:115-150` does. Two
neighbouring lines of `api.rb` are still not ported:

- `API.without_modules` (`api.rb:108-114`) maps a Symbol through
  `ActionController.const_get` and returns `MODULES - modules`. trails'
  `static withoutModules(..._modules)` ignores its arguments and returns the
  class. `Base.withoutModules` (`base.ts`) has the same problem from the other
  side: `Base::MODULES` is a list of name strings, not the modules
  (`base.rb:223-229,231-271`). The metal modules are not seated on the
  `ActionController` namespace object (`actionpack/src/namespaces.ts`), so
  `const_get` has nothing to resolve.
- `ActiveSupport.run_load_hooks(:action_controller_api, self)` and
  `ActiveSupport.run_load_hooks(:action_controller, self)` (`api.rb:152-153`)
  are not run for `API`; only `base.ts` runs its pair.

## Acceptance criteria

- `API.withoutModules` and `Base.withoutModules` return `MODULES - modules`
  over the module objects, with the Symbol arm resolved through the
  `ActionController` namespace.
- `Base.MODULES` holds the modules `base.rb:231-271` lists, and `base.ts`
  includes them from it.
- `api.ts` runs both load hooks after the include loop, and an
  `on_load(:action_controller)` block reaches an API controller.
