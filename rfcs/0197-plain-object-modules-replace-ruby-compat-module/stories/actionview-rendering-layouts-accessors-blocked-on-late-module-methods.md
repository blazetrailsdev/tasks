---
title: "actionview-rendering-layouts-accessors-blocked-on-late-module-methods"
status: draft
updated: 2026-11-12
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`actionview-module-super-blocked-on-actionpack-modules` converted `RoutingUrlFor`,
`UrlHelper`, actionpack's `ActionDispatch::Routing::UrlFor` and the
`active-record-unit.ts` setup module to plain objects. Three `new Module` remain in
`packages/actionview/lib`, each blocked:

- `rendering.ts` `Rendering`, `layouts.ts` `Layouts` / `LayoutConditions`. Their
  `super` (`process`, `_process_format`, `_normalize_args`,
  `_process_render_template_options`, `actionview/lib/action_view/rendering.rb`,
  `layouts.rb:369-378`) reaches `AbstractController::Rendering`
  (`packages/actionpack/lib/abstract-controller/rendering.ts`). Converting all
  three plus `AbstractController::Rendering` to plain objects with `rbCallSuper`
  was tried. It works for actionview's own tests, but
  `ActionController::Rendering` (`action-controller/metal/rendering.ts`),
  `Renderers` (`metal/renderers.ts`) and `ApiRendering` (`api/api-rendering.ts`)
  are also `super` callers into that chain (`render`, `render_to_string`,
  `render_to_body`). A plain module's copied methods outrank their carrier links,
  which reds "direct render to string with body" in
  `action-controller/controller/render.test.ts`. `ActionController::Rendering`
  and `ApiRendering` can convert. `Renderers` cannot: `Renderers.add`
  (`action_controller/metal/renderers.rb:62-66`, `define_method` on the module)
  defines methods on the module after `ActionController::Base` includes it.
  That is the "method defined on a module after it is included" case, and it
  needs an operator ruling (`RoutesHelpers.with`-style includer list, or a
  registry that `_render_to_body_with_renderer` reads).
- `lookup-context.ts` `Accessors`: `LookupContext.register_detail`
  (`actionview/lib/action_view/lookup_context.rb:21-37`) defines accessors on
  `Accessors` after `include Accessors` (`:228`). `lookup-context.trails.test.ts`
  pins a later `registerDetail`. This is the same case and needs the same ruling.

## Acceptance criteria

- An operator ruling on how `Renderers.add` and `register_detail` define methods
  after the include.
- `git grep -nE 'new Module\(|\.superMethod\(' -- packages/actionview/lib` is empty,
  and `Renderers`, `ActionController::Rendering`, `ApiRendering` and
  `AbstractController::Rendering` convert in the same PR.
- Each `super` is `rbCallSuper` (open includer set).
- `parity:modules` is tightened; `parity:api:calls`, `:calls:args`, `:inlined` and
  `:extra:gate` are green.
