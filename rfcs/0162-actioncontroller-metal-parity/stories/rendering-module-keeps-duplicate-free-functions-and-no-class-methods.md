---
title: "ActionController::Rendering keeps duplicate free functions and has no ClassMethods; Instrumentation and Renderers are not modules"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8557 made `ActionController::Rendering` a `Module` (`packages/actionpack/src/action-controller/metal/rendering.ts`) whose `render`, `render_to_string`, `render_to_body`, `process_action`, `_normalize_options` and `_process_options` reach `super` through `superMethod`, as `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:122-205` does. Two gaps are left in that file:

- **Two bodies per Rails method.** The older free functions `render`, `renderToString` and `renderToBody` (no `super`; `render` checks `this.performed`) are still exported beside the module's inline bodies, because `action-controller/api/api-rendering.ts` re-exports them and `metal/rendering.test.ts` calls them on plain hosts. Rails has one `render` / `render_to_string` / `render_to_body` (`rendering.rb:122-146`). The module's `renderToString` and `renderToBody` also carry `toString` / `orPriorities` closures Rails does not decompose into.
- **No `ClassMethods`.** Rails' `Rendering::ClassMethods` (`rendering.rb:12-27`) holds `delegate :render, to: :renderer`, `attr_reader :renderer`, `setup_renderer!` and `inherited` (which calls `klass.setup_renderer!`). trails keeps `renderer` / `setupRendererBang` as free functions over a `WeakMap` and the module carries no class methods.

`Base#render` and `Base#renderToBody` (`action-controller/base.ts`) are `Instrumentation#render` (`metal/instrumentation.rb:28-34`) and `Renderers#render_to_body` (`metal/renderers.rb:139-141`) written on the class, with a `super["render" as never]` cast, because neither `Instrumentation` nor `Renderers` is a `Module`.

## Acceptance criteria

- [ ] One exported function per Rails method in `metal/rendering.ts`, each the `super`-chained body, registered on the module with `defineMethod`; `api-rendering.ts` and `rendering.test.ts` use the module.
- [ ] `Rendering.ClassMethods` carries `render` (delegated to `renderer`), `renderer`, `setupRendererBang`; the `inherited` arm follows § "`inherited` is deferred to own-property memo guards".
- [ ] `Instrumentation` and `Renderers` (`Renderers::All`) are modules `Base` includes in Rails' order (`action_controller/base.rb:271-306`); `Base` defines no `render` / `renderToBody` of its own and the `super[...]` casts are gone.
